import { Priority, TaskStatus, UserRole } from '../../types/enums';
import { prisma } from '../../database/prisma';
import { ForbiddenError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { JobQueueService } from '../../jobs/queue.service';
import { AdminEmailAlertService } from '../../services/emailAlert.service';
import { emitToOrg, emitToTask, emitToUser } from '../../sockets/socket.server';
import { AuthUserPayload } from '../../types/express';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, AddTaskCommentDto } from './task.dto';

export class TaskService {
  public static async listTasks(
    user: AuthUserPayload,
    query: {
      page?: number;
      limit?: number;
      status?: TaskStatus;
      priority?: Priority;
      departmentId?: string;
      assignedToId?: string;
      search?: string;
      isOverdue?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: user.organizationId };

    // Role-based visibility scoping
    if (user.role === UserRole.EMPLOYEE && user.employeeId) {
      where.OR = [
        { assignedToId: user.employeeId },
        { createdById: user.userId },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.isOverdue) {
      where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
      where.dueDate = { lt: new Date() };
    }

    if (query.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { taskCode: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [totalCount, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          department: { select: { id: true, name: true, code: true } },
          assignedTo: {
            select: { id: true, employeeCode: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { comments: true, histories: true } },
        },
      }),
    ]);

    return { tasks, totalCount, page, limit };
  }

  public static async getTaskById(user: AuthUserPayload, id: string) {
    const task = await prisma.task.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        department: true,
        assignedTo: {
          include: {
            department: true,
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
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
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task', id);
    }

    // Role check for employee
    if (
      user.role === UserRole.EMPLOYEE &&
      user.employeeId &&
      task.assignedToId !== user.employeeId &&
      task.createdById !== user.userId
    ) {
      throw new ForbiddenError('You do not have permission to view this task.');
    }

    return task;
  }

  public static async createTask(user: AuthUserPayload, dto: CreateTaskDto) {
    const count = await prisma.task.count({ where: { organizationId: user.organizationId } });
    const taskCode = `TSK-${(count + 1001).toString()}`;

    const slaHours = dto.slaHours || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const task = await prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          organizationId: user.organizationId,
          taskCode,
          title: dto.title,
          description: dto.description,
          departmentId: dto.departmentId,
          assignedToId: dto.assignedToId,
          createdById: user.userId,
          priority: dto.priority,
          status: dto.status,
          estimatedHours: dto.estimatedHours,
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          slaHours,
          slaDeadline,
          tags: dto.tags || [],
        },
        include: {
          assignedTo: true,
          department: true,
          createdBy: true,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId: createdTask.id,
          userId: user.userId,
          action: 'TASK_CREATED',
          newValue: `Task created with status ${createdTask.status}`,
        },
      });

      return createdTask;
    });

    // Notify assigned employee if linked to a user
    if (task.assignedTo?.userId) {
      const notif = await prisma.notification.create({
        data: {
          organizationId: user.organizationId,
          userId: task.assignedTo.userId,
          title: 'New Task Assigned',
          message: `You were assigned task ${task.taskCode}: ${task.title}`,
          type: 'TASK_ASSIGNED',
          linkUrl: `/tasks/${task.id}`,
        },
      });

      emitToUser(task.assignedTo.userId, 'notification:new', notif);

      await JobQueueService.dispatchEmail({
        to: task.assignedTo.email,
        subject: `New Task Assignment: ${task.taskCode}`,
        template: 'task_assigned',
        context: { taskTitle: task.title, taskCode: task.taskCode, dueDate: task.dueDate },
      });
    }

    emitToOrg(user.organizationId, 'task:created', task);

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: task.id,
      newValues: { code: task.taskCode, title: task.title, priority: task.priority },
    });

    // Automated Alert to mozework11@gmail.com
    AdminEmailAlertService.notifyTaskEvent({
      action: 'TASK_CREATED',
      task,
      actor: user,
      organizationId: user.organizationId,
    }).catch(() => {});

    return task;
  }

  public static async updateTask(user: AuthUserPayload, id: string, dto: UpdateTaskDto) {
    const existing = await prisma.task.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    if (user.role === UserRole.EMPLOYEE && existing.createdById !== user.userId) {
      throw new ForbiddenError('Employees can only update task status or comments.');
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.status && { status: dto.status }),
        ...(dto.estimatedHours !== undefined && { estimatedHours: dto.estimatedHours }),
        ...(dto.actualHours !== undefined && { actualHours: dto.actualHours }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(dto.tags && { tags: dto.tags }),
      },
      include: {
        assignedTo: true,
        department: true,
      },
    });

    emitToTask(id, 'task:updated', updated);
    emitToOrg(user.organizationId, 'task:updated', updated);

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'TASK_UPDATED',
      entity: 'Task',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    AdminEmailAlertService.notifyTaskEvent({
      action: 'TASK_UPDATED',
      task: updated,
      actor: user,
      organizationId: user.organizationId,
    }).catch(() => {});

    return updated;
  }

  public static async updateStatus(user: AuthUserPayload, id: string, dto: UpdateTaskStatusDto) {
    const existing = await prisma.task.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { assignedTo: true },
    });

    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    if (
      user.role === UserRole.EMPLOYEE &&
      user.employeeId &&
      existing.assignedToId !== user.employeeId &&
      existing.createdById !== user.userId
    ) {
      throw new ForbiddenError('You can only update status for tasks assigned to you.');
    }

    const isCompleted = dto.status === TaskStatus.COMPLETED;
    const completedDate = isCompleted ? new Date() : existing.completedDate;
    const isSlaBreached =
      existing.slaDeadline && completedDate ? completedDate > existing.slaDeadline : existing.isSlaBreached;

    const [updated] = await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: {
          status: dto.status,
          completedDate,
          isSlaBreached,
          ...(dto.actualHours !== undefined && { actualHours: dto.actualHours }),
        },
        include: { assignedTo: true, department: true },
      }),
      prisma.taskHistory.create({
        data: {
          taskId: id,
          userId: user.userId,
          action: 'STATUS_CHANGED',
          field: 'status',
          oldValue: existing.status,
          newValue: dto.status,
        },
      }),
    ]);

    if (dto.comment) {
      await prisma.taskComment.create({
        data: {
          taskId: id,
          userId: user.userId,
          content: dto.comment,
        },
      });
    }

    emitToTask(id, 'task:status_changed', { taskId: id, status: dto.status, updated });
    emitToOrg(user.organizationId, 'task:status_changed', { taskId: id, status: dto.status });

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'TASK_STATUS_CHANGED',
      entity: 'Task',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: dto.status, completedDate, isSlaBreached },
    });

    AdminEmailAlertService.notifyTaskEvent({
      action: isCompleted ? 'TASK_COMPLETED' : 'TASK_UPDATED',
      task: updated,
      actor: user,
      organizationId: user.organizationId,
    }).catch(() => {});

    return updated;
  }

  public static async addComment(user: AuthUserPayload, taskId: string, dto: AddTaskCommentDto) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
    });

    if (!task) {
      throw new NotFoundError('Task', taskId);
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: user.userId,
        content: dto.content,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
        },
      },
    });

    emitToTask(taskId, 'task:comment_added', comment);

    return comment;
  }

  public static async deleteTask(user: AuthUserPayload, id: string) {
    const existing = await prisma.task.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    await prisma.task.delete({ where: { id } });

    emitToOrg(user.organizationId, 'task:deleted', { id });

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'TASK_DELETED',
      entity: 'Task',
      entityId: id,
      oldValues: existing,
    });

    AdminEmailAlertService.notifyTaskEvent({
      action: 'TASK_DELETED',
      task: existing,
      actor: user,
      organizationId: user.organizationId,
    }).catch(() => {});
  }
}
