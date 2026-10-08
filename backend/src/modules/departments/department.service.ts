import { prisma } from '../../database/prisma';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './department.dto';

export class DepartmentService {
  public static async listDepartments(organizationId: string) {
    const departments = await prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            employees: true,
            tasks: true,
            incidents: true,
          },
        },
      },
    });

    return departments;
  }

  public static async getDepartmentById(organizationId: string, id: string) {
    const department = await prisma.department.findFirst({
      where: { id, organizationId },
      include: {
        employees: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            status: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            incidents: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department', id);
    }

    return department;
  }

  public static async createDepartment(
    organizationId: string,
    dto: CreateDepartmentDto,
    userId?: string,
    userEmail?: string
  ) {
    const existing = await prisma.department.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictError(`Department code '${dto.code}' already exists in this organization.`);
    }

    const dept = await prisma.department.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        managerId: dto.managerId,
      },
    });

    await AuditService.log({
      organizationId,
      userId,
      userEmail,
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: dept.id,
      newValues: dept,
    });

    return dept;
  }

  public static async updateDepartment(
    organizationId: string,
    id: string,
    dto: UpdateDepartmentDto,
    userId?: string,
    userEmail?: string
  ) {
    const existing = await prisma.department.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundError('Department', id);
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
      },
    });

    await AuditService.log({
      organizationId,
      userId,
      userEmail,
      action: 'DEPARTMENT_UPDATED',
      entity: 'Department',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  public static async deleteDepartment(
    organizationId: string,
    id: string,
    userId?: string,
    userEmail?: string
  ) {
    const existing = await prisma.department.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { employees: true, tasks: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Department', id);
    }

    if (existing._count.employees > 0 || existing._count.tasks > 0) {
      throw new ConflictError('Cannot delete department with active employees or tasks assigned to it.');
    }

    await prisma.department.delete({ where: { id } });

    await AuditService.log({
      organizationId,
      userId,
      userEmail,
      action: 'DEPARTMENT_DELETED',
      entity: 'Department',
      entityId: id,
      oldValues: existing,
    });
  }
}
