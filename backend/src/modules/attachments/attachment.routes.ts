import { Router } from 'express';
import { AttachmentController } from './attachment.controller';
import { authenticate } from '../../middleware/auth';
import { enforceTenantIsolation } from '../../middleware/tenant';
import { uploadMiddleware } from './storage.service';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.post('/upload', uploadMiddleware.single('file'), AttachmentController.upload);
router.get('/entity/:entityType/:entityId', AttachmentController.getByEntity);
router.delete('/:id', AttachmentController.delete);

export default router;
