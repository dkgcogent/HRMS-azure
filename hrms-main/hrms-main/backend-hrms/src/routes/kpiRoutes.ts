import express from 'express';
import {
  getAllKPIs,
  getKPIById,
  createKPI,
  updateKPI,
  updateKPIStatus,
  submitKPIForReview,
  getKPIsForManagerReview,
  getKPIsForHRReview,
  getKPIsForAdminReview,
  submitManagerReview,
} from '../controllers/kpiController';
import { getAllAppraisalCategories } from '../controllers/appraisalCategoryController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// Debug middleware to log all KPI route requests
router.use((req, res, next) => {
  console.log(`[KPI Routes] ${req.method} ${req.path} | Original URL: ${req.originalUrl} | Base URL: ${req.baseUrl}`);
  next();
});

// IMPORTANT: Specific routes must come BEFORE parameterized routes (/:id)
// This ensures /admin/review matches before /:id tries to match 'admin' as an ID

// Test endpoint to verify routing works (remove in production)
router.get('/test-routes', (req, res) => {
  res.json({ 
    success: true, 
    message: 'KPI routes are working',
    availableRoutes: [
      'GET /api/kpi/',
      'GET /api/kpi/categories',
      'GET /api/kpi/hr/review',
      'GET /api/kpi/admin/review',
      'GET /api/kpi/manager/review',
      'GET /api/kpi/:id',
    ]
  });
});

// Base route - get all KPIs
router.get('/', authenticateToken, getAllKPIs);

// Categories route
router.get('/categories', authenticateToken, getAllAppraisalCategories);

// Review routes - MUST come before /:id route to prevent route conflicts
// Express matches routes in order, so specific routes must be defined first
router.get('/hr/review', authenticateToken, authorizeRoles('hr'), (req, res, next) => {
  console.log('[KPI Routes] Matched /hr/review route');
  next();
}, getKPIsForHRReview);

router.get('/admin/review', authenticateToken, authorizeRoles('admin'), (req, res, next) => {
  console.log('[KPI Routes] Matched /admin/review route - calling getKPIsForAdminReview');
  next();
}, getKPIsForAdminReview);

router.get('/manager/review', authenticateToken, authorizeRoles('hr', 'admin'), (req, res, next) => {
  console.log('[KPI Routes] Matched /manager/review route');
  next();
}, getKPIsForManagerReview);

// Parameterized routes - must come AFTER all specific routes
router.get('/:id', authenticateToken, getKPIById);
router.post('/', authenticateToken, createKPI);
router.put('/:id', authenticateToken, updateKPI);
router.post('/:id/submit', authenticateToken, submitKPIForReview);
router.post('/:id/manager-review', authenticateToken, authorizeRoles('hr', 'admin'), submitManagerReview);
router.put('/:id/status', authenticateToken, updateKPIStatus);

export default router;

