import { IncidentSeverity, IncidentStatus, UserRole } from '../../types/enums';
import { prisma } from '../../database/prisma';
import { ForbiddenError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { JobQueueService } from '../../jobs/queue.service';
import { AdminEmailAlertService } from '../../services/emailAlert.service';
import { emitToIncident, emitToOrg, emitToUser } from '../../sockets/socket.server';
import { AuthUserPayload } from '../../types/express';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  UpdateIncidentStatusDto,
  AddIncidentCommentDto,
} from './incident.dto';

const DEFAULT_SLA_HOURS: Record<IncidentSeverity, number> = {
  CRITICAL: 1,
  HIGH: 4,
  MEDIUM: 12,
  LOW: 48,
};

export class IncidentService {
  public static async listIncidents(
    user: AuthUserPayload,
    query: {
      page?: number;
      limit?: number;
      severity?: IncidentSeverity;
      status?: IncidentStatus;
      departmentId?: string;
      assignedEmployeeId?: string;
      isSlaBreached?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: user.organizationId };

    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.assignedEmployeeId) where.assignedEmployeeId = query.assignedEmployeeId;
    if (query.isSlaBreached !== undefined) {
      where.isSlaBreached = String(query.isSlaBreached) === 'true';
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { incidentCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [totalCount, incidents] = await Promise.all([
      prisma.incident.count({ where }),
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          department: { select: { id: true, name: true, code: true } },
          reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedEmployee: {
            select: { id: true, employeeCode: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
          _count: { select: { comments: true, histories: true } },
        },
      }),
    ]);

    // Enhance incidents with remaining SLA minutes and breach status
    const enriched = incidents.map((inc) => {
      let remainingMinutes: number | null = null;
      let slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'MET' = 'ON_TRACK';

      if (inc.status === IncidentStatus.RESOLVED || inc.status === IncidentStatus.CLOSED) {
        slaStatus = inc.isSlaBreached ? 'BREACHED' : 'MET';
      } else if (inc.slaDeadline) {
        const now = Date.now();
        const deadline = inc.slaDeadline.getTime();
        remainingMinutes = Math.round((deadline - now) / 60000);

        if (remainingMinutes <= 0) {
          slaStatus = 'BREACHED';
        } else if (remainingMinutes <= 30) {
          slaStatus = 'AT_RISK';
        }
      }

      return {
        ...inc,
        slaStatus,
        remainingMinutes,
      };
    });

    return { incidents: enriched, totalCount, page, limit };
  }

  public static async getIncidentById(user: AuthUserPayload, id: string) {
    const incident = await prisma.incident.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        department: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        assignedEmployee: {
          include: { department: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        histories: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!incident) {
      throw new NotFoundError('Incident', id);
    }

    let remainingMinutes: number | null = null;
    let slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'MET' = 'ON_TRACK';

    if (incident.status === IncidentStatus.RESOLVED || incident.status === IncidentStatus.CLOSED) {
      slaStatus = incident.isSlaBreached ? 'BREACHED' : 'MET';
    } else if (incident.slaDeadline) {
      const now = Date.now();
      const deadline = incident.slaDeadline.getTime();
      remainingMinutes = Math.round((deadline - now) / 60000);

      if (remainingMinutes <= 0) {
        slaStatus = 'BREACHED';
      } else if (remainingMinutes <= 30) {
        slaStatus = 'AT_RISK';
      }
    }

    return {
      ...incident,
      slaStatus,
      remainingMinutes,
    };
  }

  public static async createIncident(user: AuthUserPayload, dto: CreateIncidentDto) {
    const count = await prisma.incident.count({ where: { organizationId: user.organizationId } });
    const incidentCode = `INC-${(count + 2001).toString()}`;

    const slaHours = dto.slaHours || DEFAULT_SLA_HOURS[dto.severity];
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          organizationId: user.organizationId,
          incidentCode,
          title: dto.title,
          description: dto.description,
          severity: dto.severity,
          status: dto.assignedEmployeeId ? IncidentStatus.ASSIGNED : IncidentStatus.OPEN,
          departmentId: dto.departmentId,
          assignedEmployeeId: dto.assignedEmployeeId,
          reportedById: user.userId,
          slaHours,
          slaDeadline,
        },
        include: {
          department: true,
          assignedEmployee: true,
          reportedBy: true,
        },
      });

      await tx.incidentHistory.create({
        data: {
          incidentId: created.id,
          userId: user.userId,
          action: 'INCIDENT_REPORTED',
          newValue: `Incident reported with severity ${created.severity} (SLA: ${slaHours}h)`,
        },
      });

      return created;
    });

    if (incident.assignedEmployee?.userId) {
      const notif = await prisma.notification.create({
        data: {
          organizationId: user.organizationId,
          userId: incident.assignedEmployee.userId,
          title: 'Critical Incident Assigned',
          message: `You were assigned incident ${incident.incidentCode} [${incident.severity}]: ${incident.title}`,
          type: 'INCIDENT_ASSIGNED',
          linkUrl: `/incidents/${incident.id}`,
        },
      });

      emitToUser(incident.assignedEmployee.userId, 'notification:new', notif);

      await JobQueueService.dispatchEmail({
        to: incident.assignedEmployee.email,
        subject: `[${incident.severity}] Incident Assigned: ${incident.incidentCode}`,
        template: 'incident_assigned',
        context: {
          incidentCode: incident.incidentCode,
          title: incident.title,
          severity: incident.severity,
          slaHours: incident.slaHours,
        },
      });
    }

    emitToOrg(user.organizationId, 'incident:created', incident);

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'INCIDENT_CREATED',
      entity: 'Incident',
      entityId: incident.id,
      newValues: { code: incident.incidentCode, severity: incident.severity, title: incident.title },
    });

    // Automated Alert to mozework11@gmail.com
    AdminEmailAlertService.notifyIncidentEvent({
      action: 'INCIDENT_OPENED',
      incident,
      actor: user,
      organizationId: user.organizationId,
    }).catch(() => {});

    return incident;
  }

  public static async updateIncident(user: AuthUserPayload, id: string, dto: UpdateIncidentDto) {
    const existing = await prisma.incident.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new NotFoundError('Incident', id);
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.severity && { severity: dto.severity }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.assignedEmployeeId !== undefined && { assignedEmployeeId: dto.assignedEmployeeId }),
        ...(dto.resolutionNotes !== undefined && { resolutionNotes: dto.resolutionNotes }),
      },
      include: {
        department: true,
        assignedEmployee: true,
      },
    });

    emitToIncident(id, 'incident:updated', updated);
    emitToOrg(user.organizationId, 'incident:updated', updated);

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'INCIDENT_UPDATED',
      entity: 'Incident',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    AdminEmailAlertService.notifyIncidentEvent({
      action: dto.severity && dto.severity !== existing.severity ? 'SEVERITY_ESCALATED' : 'INCIDENT_OPENED',
      incident: updated,
      actor: user,
      organizationId: user.organizationId,
    }).catch(() => {});

    return updated;
  }

  public static async updateStatus(user: AuthUserPayload, id: string, dto: UpdateIncidentStatusDto) {
    const existing = await prisma.incident.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new NotFoundError('Incident', id);
    }

    const isResolving = dto.status === IncidentStatus.RESOLVED;
    const isClosing = dto.status === IncidentStatus.CLOSED;
    const resolvedAt = isResolving ? new Date() : existing.resolvedAt;
    const closedAt = isClosing ? new Date() : existing.closedAt;

    let isSlaBreached = existing.isSlaBreached;
    if (isResolving && existing.slaDeadline) {
      isSlaBreached = resolvedAt! > existing.slaDeadline;
    }

    const [updated] = await prisma.$transaction([
      prisma.incident.update({
        where: { id },
        data: {
          status: dto.status,
          resolvedAt,
          closedAt,
          isSlaBreached,
          ...(dto.resolutionNotes && { resolutionNotes: dto.resolutionNotes }),
        },
        include: { department: true, assignedEmployee: true },
      }),
      prisma.incidentHistory.create({
        data: {
          incidentId: id,
          userId: user.userId,
          action: 'STATUS_CHANGED',
          field: 'status',
          oldValue: existing.status,
          newValue: dto.status,
        },
      }),
    ]);

    emitToIncident(id, 'incident:status_changed', { incidentId: id, status: dto.status, updated });
    emitToOrg(user.organizationId, 'incident:status_changed', { incidentId: id, status: dto.status });

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'INCIDENT_STATUS_CHANGED',
      entity: 'Incident',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: dto.status, isSlaBreached, resolvedAt },
    });

    AdminEmailAlertService.notifyIncidentEvent({
      action: isResolving ? 'INCIDENT_RESOLVED' : 'SEVERITY_ESCALATED',
      incident: updated,
      actor: user,
      organizationId: user.organizationId,
      details: dto.resolutionNotes,
    }).catch(() => {});

    return updated;
  }

  public static async addComment(user: AuthUserPayload, incidentId: string, dto: AddIncidentCommentDto) {
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, organizationId: user.organizationId },
    });

    if (!incident) {
      throw new NotFoundError('Incident', incidentId);
    }

    const comment = await prisma.incidentComment.create({
      data: {
        incidentId,
        userId: user.userId,
        content: dto.content,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
        },
      },
    });

    emitToIncident(incidentId, 'incident:comment_added', comment);

    AdminEmailAlertService.notifyIncidentEvent({
      action: 'WAR_ROOM_UPDATE',
      incident,
      actor: user,
      organizationId: user.organizationId,
      details: dto.content,
    }).catch(() => {});

    return comment;
  }
}
