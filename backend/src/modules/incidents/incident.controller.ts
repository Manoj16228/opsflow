import { Request, Response, NextFunction } from 'express';
import { IncidentService } from './incident.service';
import { sendPaginated, sendSuccess } from '../../utils/response';

export class IncidentController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await IncidentService.listIncidents(req.user!, req.query as any);
      sendPaginated(res, result.incidents, result.page, result.limit, result.totalCount);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentService.getIncidentById(req.user!, req.params.id);
      sendSuccess(res, incident);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentService.createIncident(req.user!, req.body);
      sendSuccess(res, incident, 201, undefined, 'Incident reported successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentService.updateIncident(req.user!, req.params.id, req.body);
      sendSuccess(res, incident, 200, undefined, 'Incident updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentService.updateStatus(req.user!, req.params.id, req.body);
      sendSuccess(res, incident, 200, undefined, 'Incident status updated.');
    } catch (error) {
      next(error);
    }
  }

  public static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comment = await IncidentService.addComment(req.user!, req.params.id, req.body);
      sendSuccess(res, comment, 201, undefined, 'Incident comment added.');
    } catch (error) {
      next(error);
    }
  }
}
