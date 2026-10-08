import { prisma } from '../../database/prisma';
import { NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { UpdateOrganizationDto } from './organization.dto';

export class OrganizationService {
  public static async getById(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            departments: true,
            tasks: true,
            incidents: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    return org;
  }

  public static async update(
    organizationId: string,
    dto: UpdateOrganizationDto,
    userId?: string,
    userEmail?: string
  ) {
    const existing = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!existing) {
      throw new NotFoundError('Organization', organizationId);
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.industry !== undefined && { industry: dto.industry }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.settings && { settings: dto.settings }),
      },
    });

    await AuditService.log({
      organizationId,
      userId,
      userEmail,
      action: 'ORGANIZATION_UPDATED',
      entity: 'Organization',
      entityId: organizationId,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }
}
