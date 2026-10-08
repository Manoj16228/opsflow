import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service';
import { sendPaginated, sendSuccess } from '../../utils/response';

export class EmployeeController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EmployeeService.listEmployees(req.organizationId!, req.query as any);
      sendPaginated(res, result.employees, result.page, result.limit, result.totalCount);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.getEmployeeById(req.organizationId!, req.params.id);
      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.createEmployee(
        req.organizationId!,
        req.body,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, employee, 201, undefined, 'Employee created successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.updateEmployee(
        req.organizationId!,
        req.params.id,
        req.body,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, employee, 200, undefined, 'Employee updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.deleteEmployee(
        req.organizationId!,
        req.params.id,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, employee, 200, undefined, 'Employee status updated to terminated.');
    } catch (error) {
      next(error);
    }
  }
}
