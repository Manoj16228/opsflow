import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { validateRequest } from '../../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.dto';
import { UserRole } from '../../types/enums';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', EmployeeController.list);
router.get('/:id', EmployeeController.getById);
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest({ body: createEmployeeSchema }),
  EmployeeController.create
);
router.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest({ body: updateEmployeeSchema }),
  EmployeeController.update
);
router.delete('/:id', authorize(UserRole.ADMIN), EmployeeController.delete);

export default router;
