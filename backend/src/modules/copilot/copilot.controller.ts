import { Request, Response, NextFunction } from 'express';
import { CopilotService } from './copilot.service';
import { sendSuccess } from '../../utils/response';

const copilotService = new CopilotService();

export class CopilotController {
  public static async generateIncidentPostmortem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { incidentId } = req.body;
      if (!incidentId) {
        res.status(400).json({ success: false, error: { message: 'incidentId is required' } });
        return;
      }
      const report = await copilotService.generateIncidentPostmortem(incidentId, req.user!.organizationId);
      sendSuccess(res, report, 'Postmortem generated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async smartTriage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description } = req.body;
      if (!title) {
        res.status(400).json({ success: false, error: { message: 'title is required' } });
        return;
      }
      const triage = await copilotService.smartTriage(req.user!.organizationId, { title, description });
      sendSuccess(res, triage, 'Smart triage recommendations computed');
    } catch (error) {
      next(error);
    }
  }

  public static async taskBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description } = req.body;
      if (!title) {
        res.status(400).json({ success: false, error: { message: 'title is required' } });
        return;
      }
      const breakdown = await copilotService.taskBreakdown(title, description);
      sendSuccess(res, breakdown, 'Task breakdown generated');
    } catch (error) {
      next(error);
    }
  }
}
