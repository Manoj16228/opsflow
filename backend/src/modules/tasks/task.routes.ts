import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { validateRequest } from '../../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  addTaskCommentSchema,
} from './task.dto';
import { UserRole } from '../../types/enums';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', TaskController.list);
router.get('/:id', TaskController.getById);

router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest({ body: createTaskSchema }),
  TaskController.create
);

router.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest({ body: updateTaskSchema }),
  TaskController.update
);

router.patch(
  '/:id/status',
  validateRequest({ body: updateTaskStatusSchema }),
  TaskController.updateStatus
);

router.post(
  '/:id/comments',
  validateRequest({ body: addTaskCommentSchema }),
  TaskController.addComment
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  TaskController.delete
);

export default router;
