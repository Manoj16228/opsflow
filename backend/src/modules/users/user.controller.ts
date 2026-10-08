import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { sendPaginated, sendSuccess } from '../../utils/response';

export class UserController {
  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await UserService.listUsers(req.organizationId!, req.query as any);
      sendPaginated(res, result.users, result.page, result.limit, result.totalCount);
    } catch (error) {
      next(error);
    }
  }

  public static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.getUserById(req.organizationId!, req.params.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.createUser(
        req.organizationId!,
        req.body,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, user, 201, undefined, 'User created successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.updateUser(
        req.organizationId!,
        req.params.id,
        req.body,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, user, 200, undefined, 'User updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
