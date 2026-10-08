import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { validateRequest } from '../../middleware/validate';
import { createDepartmentSchema, updateDepartmentSchema } from './department.dto';
import { UserRole } from '../../types/enums';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', DepartmentController.list);
router.get('/:id', DepartmentController.getById);
router.post('/', authorize(UserRole.ADMIN), validateRequest({ body: createDepartmentSchema }), DepartmentController.create);
router.patch('/:id', authorize(UserRole.ADMIN), validateRequest({ body: updateDepartmentSchema }), DepartmentController.update);
router.delete('/:id', authorize(UserRole.ADMIN), DepartmentController.delete);

export default router;
