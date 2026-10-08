import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { config } from '../../config';
import { ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

const uploadsDir = path.resolve(config.LOCAL_STORAGE_PATH);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, CSV, Excel, Word, Text, Images.`));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter,
});

export class StorageService {
  public static async deleteFile(fileName: string, driver = 'local'): Promise<void> {
    if (driver === 'local') {
      const filePath = path.join(uploadsDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted local file: ${fileName}`);
      }
    } else {
      // Azure Blob deletion stub
      logger.info(`[Azure Storage] Deletion triggered for blob: ${fileName}`);
    }
  }

  public static getPublicUrl(fileName: string, driver = 'local'): string {
    if (driver === 'local') {
      return `/uploads/${fileName}`;
    }
    return `https://${config.AZURE_STORAGE_CONTAINER_NAME || 'opsflow'}.blob.core.windows.net/${fileName}`;
  }
}
