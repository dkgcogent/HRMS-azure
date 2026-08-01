import express from 'express';
import { getDashboardStats, getRecentActivities, getSystemHealth } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// Dashboard Routes
router.get('/stats', getDashboardStats);
router.get('/recent-activities', getRecentActivities);
router.get('/health', getSystemHealth);

export default router;
