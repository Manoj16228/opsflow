import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { validateRequest } from '../../middleware/validate';
import { updateOrganizationSchema } from './organization.dto';
import { UserRole } from '../../types/enums';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/current', OrganizationController.getDetails);
router.patch('/current', authorize(UserRole.ADMIN), validateRequest({ body: updateOrganizationSchema }), OrganizationController.update);

export default router;
