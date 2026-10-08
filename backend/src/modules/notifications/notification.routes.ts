import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', NotificationController.list);
router.get('/email-logs', NotificationController.getEmailLogs);
router.post('/test-email', NotificationController.sendTestAlert);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);
router.delete('/:id', NotificationController.delete);

export default router;
