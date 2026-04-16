// @ts-nocheck
import express from 'express';
import {
  createNewTask,
  getMyTasks,
  getHRTaskList,
  getAllTaskList,
  getTask,
  updateExistingTask,
  updateTaskStatusController,
  reassignTaskController,
  addComment,
  uploadFile,
  getActivityLogs,
  getDashboardStats,
  getUsers,
  closeTask,
  reopenTask,
} from '../controllers/taskController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { uploadSingleTaskFile } from '../middleware/taskUpload';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (all authenticated users) - must come before parameterized routes
router.get('/my', getMyTasks); // Employee: Get my tasks
router.get('/stats', getDashboardStats); // Get dashboard statistics
router.get('/users', getUsers); // Get all users for dropdowns

// HR routes - must come before parameterized routes
router.get('/hr/list', authorizeRoles('hr', 'admin'), getHRTaskList); // HR: Get tasks they created
router.post('/', authorizeRoles('hr', 'admin'), createNewTask); // Create task

// Admin routes - must come before parameterized routes
router.get('/all/list', authorizeRoles('admin'), getAllTaskList); // Admin: Get all tasks

// Parameterized routes - must come last (order matters: more specific first)
router.get('/:id/logs', getActivityLogs); // Get activity logs
router.put('/:id/status', updateTaskStatusController); // Update task status
router.post('/:id/comment', addComment); // Add comment
router.post('/:id/upload', uploadSingleTaskFile, uploadFile); // Upload file
router.put('/:id/reassign', authorizeRoles('hr', 'admin'), reassignTaskController); // Reassign task
router.put('/:id/close', authorizeRoles('hr', 'admin'), closeTask); // Close task
router.put('/:id/reopen', authorizeRoles('admin'), reopenTask); // Reopen closed task
router.put('/:id', authorizeRoles('hr', 'admin'), updateExistingTask); // Update task
router.get('/:id', getTask); // Get task details - must be last

export default router;

