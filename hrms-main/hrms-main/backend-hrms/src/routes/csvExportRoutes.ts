import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  exportKPI,
  exportAssets,
  exportEmployeeForms,
} from '../controllers/csvExportController';

const router = express.Router();

// All CSV export routes require authentication
router.get('/kpi', authenticateToken, exportKPI);
router.get('/assets', authenticateToken, exportAssets);
router.get('/employee-forms/:formType', authenticateToken, exportEmployeeForms);

export default router;










