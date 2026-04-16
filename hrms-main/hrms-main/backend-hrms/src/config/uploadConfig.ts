import path from 'path';

// Define upload base directory on D: drive (or /tmp for Vercel serverless)
export const UPLOAD_BASE_DIR = process.env.VERCEL === '1' || process.env.VERCEL ? '/tmp' : (process.env.UPLOAD_BASE_DIR || 'D:/HRMS_Uploads');

// PDF Storage directory
export const PDF_STORAGE_DIR = path.join(UPLOAD_BASE_DIR, 'pdfs');

// Photos directory
export const PHOTOS_DIR = path.join(UPLOAD_BASE_DIR, 'photos');

// Documents directory
export const DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, 'documents');

// Assets directory
export const ASSETS_DIR = path.join(UPLOAD_BASE_DIR, 'hrms_assets');

