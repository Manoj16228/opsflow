import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/overview', AnalyticsController.getOverview);
router.get('/tasks', AnalyticsController.getTaskAnalytics);
router.get('/incidents', AnalyticsController.getIncidentAnalytics);
router.get('/workload', AnalyticsController.getWorkloadAnalytics);

export default router;
