import { Request, Response, NextFunction } from 'express';
import { AttachmentService } from './attachment.service';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { AttachmentEntityType } from '../../types/enums';

export class AttachmentController {
  public static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No file provided in request.');
      }

      const { entityType, entityId } = req.body;
      if (!entityType || !entityId) {
        throw new ValidationError('entityType (TASK | INCIDENT) and entityId are required.');
      }

      const attachment = await AttachmentService.saveAttachment(
        req.user!,
        req.file,
        entityType.toUpperCase() as AttachmentEntityType,
        entityId
      );

      sendSuccess(res, attachment, 201, undefined, 'File uploaded successfully.');
    } catch (error) {
      next(error);
    }
  }

  public static async getByEntity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const attachments = await AttachmentService.getAttachmentsByEntity(
        req.organizationId!,
        entityType.toUpperCase() as AttachmentEntityType,
        entityId
      );
      sendSuccess(res, attachments);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AttachmentService.deleteAttachment(req.user!, req.params.id);
      sendSuccess(res, { deleted: true }, 200, undefined, 'Attachment deleted.');
    } catch (error) {
      next(error);
    }
  }
}
