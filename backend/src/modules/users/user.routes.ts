import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { validateRequest } from '../../middleware/validate';
import { createUserSchema, updateUserSchema } from './user.dto';
import { UserRole } from '../../types/enums';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', authorize(UserRole.ADMIN, UserRole.MANAGER), UserController.listUsers);
router.get('/:id', UserController.getUserById);
router.post('/', authorize(UserRole.ADMIN), validateRequest({ body: createUserSchema }), UserController.createUser);
router.patch('/:id', authorize(UserRole.ADMIN), validateRequest({ body: updateUserSchema }), UserController.updateUser);

export default router;
