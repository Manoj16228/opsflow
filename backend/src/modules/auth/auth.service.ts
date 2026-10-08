import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '../../types/enums';
import { prisma } from '../../database/prisma';
import { config } from '../../config';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { JobQueueService } from '../../jobs/queue.service';
import { AuthUserPayload } from '../../types/express';
import { LoginDto, RegisterDto } from './auth.dto';

export class AuthService {
  public static async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Generate slug from org name
    const baseSlug = dto.organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Transactionally create Organization, Admin User, and default Department
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
          plan: 'ENTERPRISE',
        },
      });

      const dept = await tx.department.create({
        data: {
          organizationId: org.id,
          name: 'Executive & Operations',
          code: 'EXEC',
          description: 'Primary corporate management & executive operations',
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      const employee = await tx.employee.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          departmentId: dept.id,
          employeeCode: 'EMP-0001',
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          designation: 'Operations Director & Administrator',
          skills: ['Leadership', 'Operations Management', 'Platform Administration'],
        },
      });

      return { org, user, employee };
    });

    // Record Audit
    await AuditService.log({
      organizationId: result.org.id,
      userId: result.user.id,
      userEmail: result.user.email,
      action: 'USER_REGISTERED',
      entity: 'Organization',
      entityId: result.org.id,
      newValues: { organization: result.org.name, email: result.user.email },
      ipAddress,
      userAgent,
    });

    // Dispatch welcome email via queue
    await JobQueueService.dispatchEmail({
      to: result.user.email,
      subject: `Welcome to OpsFlow - ${result.org.name}`,
      template: 'welcome',
      context: { name: result.user.firstName, organization: result.org.name },
    });

    // Automated Alert to mozework11@gmail.com
    import('../../services/emailAlert.service').then(({ AdminEmailAlertService }) => {
      AdminEmailAlertService.notifyMajorChangeEvent({
        category: 'ROLE_CHANGED',
        title: `New Organization & Admin Registered: ${result.org.name}`,
        description: `New organization account created for "${result.org.name}" by user ${result.user.firstName} ${result.user.lastName} (${result.user.email}).`,
        actor: { firstName: result.user.firstName, lastName: result.user.lastName, email: result.user.email },
        organizationId: result.org.id,
        metadataTable: [
          { label: 'Organization Name', value: result.org.name },
          { label: 'Admin User Email', value: result.user.email },
          { label: 'Assigned Role', value: result.user.role },
          { label: 'Initial Department', value: result.employee.designation },
        ],
      }).catch(() => {});
    });

    const tokens = await this.generateTokens({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      organizationId: result.org.id,
      employeeId: result.employee.id,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        organizationId: result.org.id,
        organizationName: result.org.name,
        employeeId: result.employee.id,
      },
      tokens,
    };
  }

  public static async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        organization: true,
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(`Account is currently ${user.status.toLowerCase()}. Please contact your administrator.`);
    }

    if (!user.organization.isActive) {
      throw new UnauthorizedError('Your organization account has been suspended or deactivated.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login audit
    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const tokens = await this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      employeeId: user.employeeProfile?.id,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        employeeId: user.employeeProfile?.id,
      },
      tokens,
    };
  }

  public static async refreshTokens(refreshTokenStr: string) {
    let payload: any;
    try {
      payload = jwt.verify(refreshTokenStr, config.JWT_REFRESH_SECRET);
    } catch (err: any) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: refreshTokenStr },
      include: {
        user: {
          include: {
            organization: true,
            employeeProfile: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
      throw new UnauthorizedError('Refresh token has been revoked or expired.');
    }

    // Rotate: Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const user = storedToken.user;
    if (user.status !== UserStatus.ACTIVE || !user.organization.isActive) {
      throw new UnauthorizedError('Account is inactive.');
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      employeeId: user.employeeProfile?.id,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return tokens;
  }

  public static async logout(refreshTokenStr?: string, userId?: string) {
    if (refreshTokenStr) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: refreshTokenStr },
        data: { isRevoked: true },
      });
    } else if (userId) {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
  }

  public static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logoUrl: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            employeeCode: true,
            designation: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  private static async generateTokens(payload: AuthUserPayload) {
    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ userId: payload.userId }, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        tokenHash: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_EXPIRES_IN,
    };
  }
}
