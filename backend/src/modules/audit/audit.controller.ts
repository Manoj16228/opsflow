import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { sendPaginated } from '../../utils/response';

export class AuditController {
  public static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId!;
      const result = await AuditService.getLogs(organizationId, req.query);

      sendPaginated(res, result.logs, result.page, result.limit, result.totalCount);
    } catch (error) {
      next(error);
    }
  }
}
