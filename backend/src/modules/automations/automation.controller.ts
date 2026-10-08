import { Request, Response, NextFunction } from 'express';
import { AutomationService } from './automation.service';
import { sendSuccess } from '../../utils/response';

export class AutomationController {
  public static async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await AutomationService.listRules(req.user!.organizationId);
      sendSuccess(res, rules, 'Automation rules retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async toggleRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await AutomationService.toggleRule(req.user!.organizationId, id);
      sendSuccess(res, rule, 'Automation rule updated');
    } catch (error) {
      next(error);
    }
  }

  public static async executeRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AutomationService.executeRule(req.user!.organizationId, id);
      sendSuccess(res, result, 'Automation rule executed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, trigger, condition, action, enabled = true } = req.body;
      if (!name || !trigger || !action) {
        res.status(400).json({ success: false, error: { message: 'name, trigger, and action are required' } });
        return;
      }
      const rule = await AutomationService.createRule(req.user!.organizationId, {
        name,
        description: description || '',
        trigger,
        condition: condition || 'true',
        action,
        enabled,
      });
      sendSuccess(res, rule, 'Automation rule created');
    } catch (error) {
      next(error);
    }
  }
}
