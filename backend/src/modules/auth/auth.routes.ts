import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.dto';

const router = Router();

router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

export default router;
