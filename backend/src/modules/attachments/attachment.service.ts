import { AttachmentEntityType } from '../../types/enums';
import { prisma } from '../../database/prisma';
import { NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { StorageService } from './storage.service';
import { AuthUserPayload } from '../../types/express';

export class AttachmentService {
  public static async saveAttachment(
    user: AuthUserPayload,
    file: Express.Multer.File,
    entityType: AttachmentEntityType,
    entityId: string
  ) {
    const fileUrl = StorageService.getPublicUrl(file.filename);

    const attachment = await prisma.attachment.create({
      data: {
        organizationId: user.organizationId,
        uploadedById: user.userId,
        entityType,
        entityId,
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileUrl,
        storageDriver: 'local',
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'FILE_UPLOADED',
      entity: entityType === 'TASK' ? 'Task' : 'Incident',
      entityId,
      newValues: { fileName: file.originalname, size: file.size },
    });

    return attachment;
  }

  public static async getAttachmentsByEntity(
    organizationId: string,
    entityType: AttachmentEntityType,
    entityId: string
  ) {
    return prisma.attachment.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  public static async deleteAttachment(user: AuthUserPayload, id: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment', id);
    }

    await StorageService.deleteFile(attachment.fileName, attachment.storageDriver);
    await prisma.attachment.delete({ where: { id } });

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      action: 'FILE_DELETED',
      entity: 'Attachment',
      entityId: id,
      oldValues: { fileName: attachment.originalName },
    });
  }
}
