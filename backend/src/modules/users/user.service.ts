import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../../types/enums';
import { prisma } from '../../database/prisma';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';

export class UserService {
  public static async listUsers(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
    ]);

    return { users, totalCount, page, limit };
  }

  public static async getUserById(organizationId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      include: {
        employeeProfile: {
          include: {
            department: true,
            manager: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }

  public static async createUser(
    organizationId: string,
    dto: CreateUserDto,
    creatorId?: string,
    creatorEmail?: string
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          organizationId,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
          status: UserStatus.ACTIVE,
        },
      });

      // Also create matching employee record if requested
      const count = await tx.employee.count({ where: { organizationId } });
      const employeeCode = `EMP-${(count + 1).toString().padStart(4, '0')}`;

      await tx.employee.create({
        data: {
          organizationId,
          userId: createdUser.id,
          employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          designation: dto.designation || (dto.role === 'MANAGER' ? 'Operations Manager' : 'Operations Specialist'),
          departmentId: dto.departmentId,
        },
      });

      return createdUser;
    });

    await AuditService.log({
      organizationId,
      userId: creatorId,
      userEmail: creatorEmail,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValues: { email: user.email, role: user.role },
    });

    return user;
  }

  public static async updateUser(
    organizationId: string,
    userId: string,
    dto: UpdateUserDto,
    actorId?: string,
    actorEmail?: string
  ) {
    const existing = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!existing) {
      throw new NotFoundError('User', userId);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.role && { role: dto.role }),
        ...(dto.status && { status: dto.status }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    await AuditService.log({
      organizationId,
      userId: actorId,
      userEmail: actorEmail,
      action: dto.role !== existing.role ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
      entity: 'User',
      entityId: userId,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }
}
