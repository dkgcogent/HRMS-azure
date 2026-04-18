// @ts-nocheck
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { UPLOAD_BASE_DIR } from '../config/uploadConfig';
const tasksDir = path.join(UPLOAD_BASE_DIR, 'tasks');

// Ensure uploads directory exists
if (!fs.existsSync(tasksDir)) {
  fs.mkdirSync(tasksDir, { recursive: true });
  console.log(`✓ Created task upload directory: ${tasksDir}`);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tasksDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

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

