import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service';
import { sendSuccess } from '../../utils/response';

export class OrganizationController {
  public static async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.getById(req.organizationId!);
      sendSuccess(res, org);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await OrganizationService.update(
        req.organizationId!,
        req.body,
        req.user?.userId,
        req.user?.email
      );
      sendSuccess(res, updated, 200, undefined, 'Organization settings updated.');
    } catch (error) {
      next(error);
    }
  }
}
