
import express from 'express';
import multer from 'multer';
import path from 'path';
import { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, uploadEmployeeDocument, searchEmployees, createEmployeeWithPhoto, updateEmployeeWithPhoto, getEmployeeDocuments, deleteEmployeeDocument } from '../controllers/employeeController';

const router = express.Router();

import { UPLOAD_BASE_DIR } from '../config/uploadConfig';

// Multer storage configuration for documents
const storage = multer.memoryStorage();

// Multer storage configuration for photos
const photoStorage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadPhoto = multer({ storage: photoStorage });

// Specific routes must come before parameterized routes
router.get('/', getAllEmployees);
// Search Route
router.get('/search', searchEmployees);
// Test route to verify route registration
router.get('/test', (req, res) => {
  res.json({ message: 'Employee routes are working' });
});

// Document Routes (must come before parameterized routes)
router.post('/documents/upload', upload.single('file'), uploadEmployeeDocument);
router.delete('/documents/:documentId', deleteEmployeeDocument);

// Parameterized routes (must come after specific routes)
router.get('/:id/documents', getEmployeeDocuments);
router.get('/:id', getEmployeeById);
router.post('/', uploadPhoto.single('photo'), createEmployeeWithPhoto);
router.post('/create', createEmployee); // JSON-only endpoint
router.put('/:id', uploadPhoto.single('photo'), updateEmployeeWithPhoto);
router.put('/:id/update', updateEmployee); // JSON-only endpoint
router.delete('/:id', deleteEmployee);

export default router;
