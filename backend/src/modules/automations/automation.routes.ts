import { Router } from 'express';
import { AutomationController } from './automation.controller';
import { authenticate } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', AutomationController.listRules);
router.post('/', AutomationController.createRule);
router.patch('/:id/toggle', AutomationController.toggleRule);
router.post('/:id/execute', AutomationController.executeRule);

export default router;
