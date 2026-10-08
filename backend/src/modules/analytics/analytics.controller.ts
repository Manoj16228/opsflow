import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

export class AnalyticsController {
  public static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getOverview(req.organizationId!, req.query as any);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getTaskAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getTaskAnalytics(
        req.organizationId!,
        req.query.departmentId as string | undefined
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getIncidentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getIncidentAnalytics(
        req.organizationId!,
        req.query.departmentId as string | undefined
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getWorkloadAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getWorkloadAnalytics(
        req.organizationId!,
        req.query.departmentId as string | undefined
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
