import { EmployeeStatus } from '../../types/enums';
import { prisma } from '../../database/prisma';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employee.dto';

export class EmployeeService {
  public static async listEmployees(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      departmentId?: string;
      status?: EmployeeStatus;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [totalCount, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true, designation: true },
          },
          _count: {
            select: {
              assignedTasks: true,
              assignedIncidents: true,
              directReports: true,
            },
          },
        },
      }),
    ]);

    // Enhance employees with active workload count
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const activeTasks = await prisma.task.count({
          where: {
            assignedToId: emp.id,
            status: { in: ['ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW'] },
          },
        });
        const activeIncidents = await prisma.incident.count({
          where: {
            assignedEmployeeId: emp.id,
            status: { in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] },
          },
        });

        return {
          ...emp,
          activeWorkload: {
            activeTasks,
            activeIncidents,
            totalActive: activeTasks + activeIncidents,
          },
        };
      })
    );

    return { employees: enriched, totalCount, page, limit };
  }

  public static async getEmployeeById(organizationId: string, id: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId },
      include: {
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true },
        },
        directReports: {
          select: { id: true, firstName: true, lastName: true, designation: true, email: true, status: true },
        },
        user: {
          select: { id: true, role: true, status: true, lastLoginAt: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundError('Employee', id);
    }

    // Workload & Performance Analytics for employee
    const [totalAssignedTasks, completedTasks, overdueTasks, assignedIncidents, resolvedIncidents] =
      await Promise.all([
        prisma.task.count({ where: { assignedToId: id } }),
        prisma.task.count({ where: { assignedToId: id, status: 'COMPLETED' } }),
        prisma.task.count({
          where: {
            assignedToId: id,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            dueDate: { lt: new Date() },
          },
        }),
        prisma.incident.count({ where: { assignedEmployeeId: id } }),
        prisma.incident.count({
          where: { assignedEmployeeId: id, status: { in: ['RESOLVED', 'CLOSED'] } },
        }),
      ]);

    const slaMetIncidents = await prisma.incident.count({
      where: {
        assignedEmployeeId: id,
        status: { in: ['RESOLVED', 'CLOSED'] },
        isSlaBreached: false,
      },
    });

    const slaComplianceRate =
      resolvedIncidents > 0 ? Math.round((slaMetIncidents / resolvedIncidents) * 100) : 100;

    const taskCompletionRate =
      totalAssignedTasks > 0 ? Math.round((completedTasks / totalAssignedTasks) * 100) : 100;

    // Recent 5 tasks and 5 incidents
    const [recentTasks, recentIncidents] = await Promise.all([
      prisma.task.findMany({
        where: { assignedToId: id },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.incident.findMany({
        where: { assignedEmployeeId: id },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      ...employee,
      performance: {
        totalAssignedTasks,
        completedTasks,
        overdueTasks,
        taskCompletionRate,
        assignedIncidents,
        resolvedIncidents,
        slaComplianceRate,
      },
      recentTasks,
      recentIncidents,
    };
  }

  public static async createEmployee(
    organizationId: string,
    dto: CreateEmployeeDto,
    userId?: string,
    userEmail?: string
  ) {
    const existing = await prisma.employee.findFirst({
      where: { email: dto.email.toLowerCase(), organizationId },
    });

    if (existing) {
      throw new ConflictError('An employee with this email already exists in this organization.');
    }

    const count = await prisma.employee.count({ where: { organizationId } });
    const employeeCode = `EMP-${(count + 1).toString().padStart(4, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        organizationId,
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        departmentId: dto.departmentId,
        managerId: dto.managerId,
        designation: dto.designation,
        skills: dto.skills || [],
        status: dto.status,
        avatarUrl: dto.avatarUrl,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
      },
      include: {
        department: true,
        manager: true,
      },
    });

    await AuditService.log({
      organizationId,
      userId,
      userEmail,
      action: 'EMPLOYEE_CREATED',
      entity: 'Employee',
      entityId: employee.id,
      newValues: { code: employee.employeeCode, email: employee.email, designation: employee.designation },
    });

    return employee;
  }

  public static async updateEmployee(
    organizationId: string,
    id: string,
    dto: UpdateEmployeeDto,
    userId?: string,
    userEmail?: string
  ) {
    const existing = await prisma.employee.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundError('Employee', id);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.designation && { designation: dto.designation }),
        ...(dto.skills && { skills: dto.skills }),
        ...(dto.status && { status: dto.status }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      include: {
        department: true,
        manager: true,
      },
    });

    await AuditService.log({
      organizationId,
      userId,
      userEmail,
      action: 'EMPLOYEE_UPDATED',
      entity: 'Employee',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  public static async deleteEmployee(
    organizationId: string,
    id: string,
    userId?: string,
    userEmail?: string
  ) {
    const existing = await prisma.employee.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { assignedTasks: true, assignedIncidents: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Employee', id);
    }

    // Soft-delete or update status to TERMINATED
    const updated = await prisma.employee.update({
      where: { id },
      data: { status: EmployeeStatus.TERMINATED },
    });

    await AuditService.log({
      organizationId,
      userId,
      userEmail,
      action: 'EMPLOYEE_TERMINATED',
      entity: 'Employee',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }
}
