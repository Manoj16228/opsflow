import { Router } from 'express';
import { CopilotController } from './copilot.controller';
import { authenticate } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.post('/incident-rca', CopilotController.generateIncidentPostmortem);
router.post('/smart-triage', CopilotController.smartTriage);
router.post('/task-breakdown', CopilotController.taskBreakdown);

export default router;
