import { Router } from 'express';
import { IncidentController } from './incident.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { validateRequest } from '../../middleware/validate';
import {
  createIncidentSchema,
  updateIncidentSchema,
  updateIncidentStatusSchema,
  addIncidentCommentSchema,
} from './incident.dto';
import { UserRole } from '../../types/enums';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', IncidentController.list);
router.get('/:id', IncidentController.getById);

router.post(
  '/',
  validateRequest({ body: createIncidentSchema }),
  IncidentController.create
);

router.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest({ body: updateIncidentSchema }),
  IncidentController.update
);

router.patch(
  '/:id/status',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest({ body: updateIncidentStatusSchema }),
  IncidentController.updateStatus
);

router.post(
  '/:id/comments',
  validateRequest({ body: addIncidentCommentSchema }),
  IncidentController.addComment
);

export default router;
