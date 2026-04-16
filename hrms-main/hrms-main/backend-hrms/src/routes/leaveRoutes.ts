import express from 'express';
import {
  getAllLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType
} from '../controllers/leaveTypeController';
import {
  getAllLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequestStatus
} from '../controllers/leaveRequestController';

const router = express.Router();

// Leave Types Routes
router.get('/types', getAllLeaveTypes);
router.get('/types/:id', getLeaveTypeById);
router.post('/types', createLeaveType);
router.put('/types/:id', updateLeaveType);
router.delete('/types/:id', deleteLeaveType);

// Leave Requests Routes
router.get('/', getAllLeaveRequests);
router.get('/:id', getLeaveRequestById);
router.post('/', createLeaveRequest);
router.put('/:id/status', updateLeaveRequestStatus);

export default router;