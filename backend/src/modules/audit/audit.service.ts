import { prisma } from '../../database/prisma';
import { logger } from '../../utils/logger';

export interface CreateAuditLogParams {
  organizationId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          userId: params.userId,
          userEmail: params.userEmail,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
          newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
      logger.debug(`[AuditLog] ${params.action} on ${params.entity}:${params.entityId} logged.`);
    } catch (error: any) {
      logger.error(`[AuditLog Failure] Failed to record audit log: ${error.message}`);
    }
  }

  public static async getLogs(
    organizationId: string,
    filters: {
      page?: number;
      limit?: number;
      action?: string;
      entity?: string;
      entityId?: string;
      userId?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.entity) {
      where.entity = filters.entity;
    }
    if (filters.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { userEmail: { contains: filters.search, mode: 'insensitive' } },
        { entityId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      logs,
      totalCount,
      page,
      limit,
    };
  }
}
