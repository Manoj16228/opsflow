import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendPaginated, sendSuccess } from '../../utils/response';

export class NotificationController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationService.getUserNotifications(
        req.user!.userId,
        req.organizationId!,
        req.query as any
      );
      sendPaginated(res, result.notifications, result.page, result.limit, result.totalCount, {
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await NotificationService.markAsRead(req.user!.userId, req.params.id);
      sendSuccess(res, updated, 200, undefined, 'Notification marked as read.');
    } catch (error) {
      next(error);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.markAllAsRead(req.user!.userId, req.organizationId!);
      sendSuccess(res, { success: true }, 200, undefined, 'All notifications marked as read.');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.deleteNotification(req.user!.userId, req.params.id);
      sendSuccess(res, { deleted: true }, 200, undefined, 'Notification deleted.');
    } catch (error) {
      next(error);
    }
  }

  public static async getEmailLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { AdminEmailAlertService } = await import('../../services/emailAlert.service');
      const limit = Number(req.query.limit) || 50;
      const logs = AdminEmailAlertService.getEmailLogs(limit);
      sendSuccess(res, {
        targetAdminEmail: process.env.ADMIN_ALERT_EMAIL || 'mozework11@gmail.com',
        totalDispatched: logs.length,
        logs,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async sendTestAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { AdminEmailAlertService } = await import('../../services/emailAlert.service');
      const targetEmail = process.env.ADMIN_ALERT_EMAIL || 'mozework11@gmail.com';
      const user = req.user!;

      const log = await AdminEmailAlertService.sendAlertEmail({
        subject: `⚡ [TEST ALERT] OpsFlow Enterprise Notification Test`,
        category: 'TEST_MAIL',
        headline: `OpsFlow Automated Mail Dispatch Test`,
        preheader: `Real-time test alert dispatched to designated admin`,
        badgeText: `SYSTEM TEST &bull; OPERATIONAL`,
        badgeColor: '#10b981',
        descriptionText: `This is an automated test dispatch confirming that the OpsFlow notification pipeline is operational and configured to alert ${targetEmail} on all tasks, incidents, and major changes.`,
        detailsTable: [
          { label: 'Admin Email Target', value: targetEmail },
          { label: 'Initiated By', value: `${user.email} (${user.role})` },
          { label: 'Environment', value: process.env.NODE_ENV || 'development' },
          { label: 'Timestamp (UTC)', value: new Date().toISOString() },
        ],
        actionUrl: `http://localhost:3000`,
        actionText: 'Open OpsFlow Console',
        organizationId: req.organizationId,
      });

      sendSuccess(res, {
        delivered: true,
        recipient: targetEmail,
        log,
      }, 200, undefined, `Test email alert successfully dispatched to ${targetEmail}`);
    } catch (error) {
      next(error);
    }
  }
}

