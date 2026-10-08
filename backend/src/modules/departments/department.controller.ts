import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';
import { sendSuccess } from '../../utils/response';

export class DepartmentController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await DepartmentService.listDepartments(req.organizationId!);
      sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await DepartmentService.getDepartmentById(req.organizationId!, req.params.id);
      sendSuccess(res, department);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await DepartmentService.createDepartment(
        req.organizationId!,
        req.body,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, department, 201, undefined, 'Department created successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await DepartmentService.updateDepartment(
        req.organizationId!,
        req.params.id,
        req.body,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, department, 200, undefined, 'Department updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await DepartmentService.deleteDepartment(
        req.organizationId!,
        req.params.id,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, { deleted: true }, 200, undefined, 'Department deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}
