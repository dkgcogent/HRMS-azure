// @ts-nocheck
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Use the same upload base directory as configured in index.ts
// For Windows: D:/HRMS_Uploads/assets
// For development: relative path
const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR || 'D:/HRMS_Uploads';
const uploadsDir = path.join(UPLOAD_BASE_DIR, 'hrms_assets');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`✓ Created asset upload directory: ${uploadsDir}`);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

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

