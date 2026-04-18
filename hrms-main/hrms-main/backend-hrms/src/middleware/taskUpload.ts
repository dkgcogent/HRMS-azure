// @ts-nocheck
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { UPLOAD_BASE_DIR } from '../config/uploadConfig';
// Configure storage
const storage = multer.memoryStorage();

// File filter - allow all file types for tasks
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, true);
};

// Configure multer
export const uploadTaskFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Single file upload
export const uploadSingleTaskFile = uploadTaskFile.single('file');

