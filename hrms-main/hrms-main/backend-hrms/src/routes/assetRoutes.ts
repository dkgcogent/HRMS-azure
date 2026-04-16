// @ts-nocheck
import express from 'express';
import {
  getAllAssets,
  getAsset,
  createNewAsset,
  updateExistingAsset,
  deleteAsset,
  uploadPhotos,
  deletePhoto,
  getHistory,
  calculateAssetDepreciation,
  assignAsset,
  returnAsset,
  getAssetsByEmployee,
  fixInconsistentAssets,
} from '../controllers/assetController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { uploadMultiplePhotos } from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
// IMPORTANT: Specific routes must come BEFORE parameterized routes (/:id)
// Fix inconsistent assets endpoint - must be first to avoid route conflicts
router.post('/fix-inconsistent', fixInconsistentAssets);
router.get('/', getAllAssets);
router.get('/employee/:employeeId', getAssetsByEmployee);
router.get('/:id/history', getHistory); // Must come before /:id
router.get('/:id', getAsset);
router.post('/calculate-depreciation', calculateAssetDepreciation);

// Admin/Manager only routes
router.use(authorizeRoles('admin', 'hr'));

router.post('/', createNewAsset);
router.put('/:id', updateExistingAsset);
router.delete('/:id', deleteAsset);
router.post('/:assetId/photos', uploadMultiplePhotos, uploadPhotos);
router.delete('/:assetId/photos/:photoId', deletePhoto);
router.post('/:id/assign', assignAsset);
router.post('/:id/return', returnAsset);

export default router;
