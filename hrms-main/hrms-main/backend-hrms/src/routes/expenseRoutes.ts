import express from 'express';
import {
  getAllExpenseCategories,
  createExpenseCategory
} from '../controllers/expenseCategoryController';
import {
  getAllExpenseRequests,
  getExpenseRequestById,
  createExpenseRequest,
  updateExpenseRequestStatus
} from '../controllers/expenseRequestController';

const router = express.Router();

// Expense Categories Routes
router.get('/categories', getAllExpenseCategories);
router.post('/categories', createExpenseCategory);

// Expense Requests Routes
router.get('/', getAllExpenseRequests);
router.get('/:id', getExpenseRequestById);
router.post('/', createExpenseRequest);
router.put('/:id/status', updateExpenseRequestStatus);

export default router;