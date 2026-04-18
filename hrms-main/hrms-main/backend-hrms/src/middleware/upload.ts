// @ts-nocheck
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { ASSETS_DIR } from '../config/uploadConfig';

// Configure storage
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
export const uploadAssetPhotos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Single file upload
export const uploadSinglePhoto = uploadAssetPhotos.single('photo');

// Multiple files upload
export const uploadMultiplePhotos = uploadAssetPhotos.array('photos', 10); // Max 10 photos

