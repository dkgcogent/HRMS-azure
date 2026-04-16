
import express from 'express';
import { getAllPerformanceReviews, getPerformanceReviewById, createPerformanceReview, updatePerformanceReview, deletePerformanceReview } from '../controllers/performanceReviewController';
import { getAllGoals, getGoalById, createGoal, updateGoal, deleteGoal } from '../controllers/goalController';
import { getAllFeedback, getFeedbackById, createFeedback, updateFeedback, deleteFeedback } from '../controllers/feedbackController';

const router = express.Router();

// Performance Reviews Routes
router.get('/performance-reviews', getAllPerformanceReviews);
router.get('/performance-reviews/:id', getPerformanceReviewById);
router.post('/performance-reviews', createPerformanceReview);
router.put('/performance-reviews/:id', updatePerformanceReview);
router.delete('/performance-reviews/:id', deletePerformanceReview);

// Goals Routes
router.get('/goals', getAllGoals);
router.get('/goals/:id', getGoalById);
router.post('/goals', createGoal);
router.put('/goals/:id', updateGoal);
router.delete('/goals/:id', deleteGoal);

// Feedback Routes
router.get('/feedback', getAllFeedback);
router.get('/feedback/:id', getFeedbackById);
router.post('/feedback', createFeedback);
router.put('/feedback/:id', updateFeedback);
router.delete('/feedback/:id', deleteFeedback);

export default router;
