import express from 'express';
import {
  getAllAttendanceForManagers,
  updateAttendanceRecord,
  adminApprove,
  getAttendanceReports
} from '../controllers/attendanceController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin', 'hr'));

// List
router.get('/list', getAllAttendanceForManagers);

// Update (expects id in body for convenience)
router.put('/update', async (req, res, next) => {
  if (!req.body?.id) return res.status(400).json({ success: false, message: 'id is required' });
  (req as any).params = { id: String(req.body.id) };
  return updateAttendanceRecord(req, res);
});

// Approve (manual or regularization)
router.post('/approve', adminApprove);

// Reports
router.get('/reports', getAttendanceReports);

export default router;


