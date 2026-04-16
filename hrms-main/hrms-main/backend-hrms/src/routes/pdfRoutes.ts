import express from 'express';
import {
  generateKPIPDF,
  downloadKPIPDF,
  generateAssetPDF,
  downloadAssetPDF,
  generateEmployeeFormPDF,
  downloadEmployeeFormPDF,
} from '../controllers/pdfController';
import {
  exportKPI,
  exportAssets,
  exportEmployeeForms,
} from '../controllers/csvExportController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// KPI PDF routes
router.post('/kpi/:kpiId/generate', authenticateToken, generateKPIPDF);
router.get('/kpi/:kpiId/download', authenticateToken, downloadKPIPDF);

// Asset PDF routes
router.post('/asset/:assetId/generate', authenticateToken, generateAssetPDF);
router.get('/asset/:assetId/download', authenticateToken, downloadAssetPDF);

// Employee Form PDF routes (Leave, Expense, etc.)
router.post('/form/:formType/:formId/generate', authenticateToken, generateEmployeeFormPDF);
router.get('/form/:formType/:formId/download', authenticateToken, downloadEmployeeFormPDF);

// CSV Export routes
router.get('/kpi/export', authenticateToken, exportKPI);
router.get('/assets/export', authenticateToken, exportAssets);
router.get('/forms/:formType/export', authenticateToken, exportEmployeeForms);

export default router;

