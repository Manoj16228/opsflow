import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { UserRole } from '../../types/enums';

const router = Router();

// Only ADMIN can access audit logs
router.use(authenticate, enforceTenantIsolation, authorize(UserRole.ADMIN));

router.get('/', AuditController.getLogs);

export default router;
