import express from 'express';
import { getDashboardStats, getRecentActivities, getSystemHealth } from '../controllers/dashboardController';

const router = express.Router();

// Dashboard Routes
router.get('/stats', getDashboardStats);
router.get('/recent-activities', getRecentActivities);
router.get('/health', getSystemHealth);

export default router;
