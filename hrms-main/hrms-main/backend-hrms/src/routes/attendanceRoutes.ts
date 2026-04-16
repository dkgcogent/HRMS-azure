
import express from 'express';
import {
  getAllAttendanceRecords,
  getAttendanceRecordById,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  markAttendance,
  autoClockIn,
  autoClockOut,
  submitManualAttendance,
  getMyAttendanceRecords,
  approveManualAttendance,
  approveRegularization,
  getAllAttendanceForManagers,
  requestRegularization,
  getMyRegularizationStatus,
  getPendingManualRequests,
  getPendingRegularizationRequests,
  gpsMark
} from '../controllers/attendanceController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// Authenticated routes
router.use(authenticateToken);

// Employee endpoints
router.post('/mark', authorizeRoles('employee', 'hr', 'admin'), markAttendance);                  // alias
router.post('/auto-login', authorizeRoles('employee', 'hr', 'admin'), autoClockIn);              // alias
router.post('/gps-mark', authorizeRoles('employee', 'hr', 'admin'), gpsMark);                    // alias
router.post('/auto-clock-in', authorizeRoles('employee', 'hr', 'admin'), autoClockIn);
router.post('/auto-clock-out', authorizeRoles('employee', 'hr', 'admin'), autoClockOut);
router.post('/manual', authorizeRoles('employee', 'hr', 'admin'), submitManualAttendance);
router.post('/manual-punch', authorizeRoles('employee', 'hr', 'admin'), submitManualAttendance); // alias
router.get('/my-records', authorizeRoles('employee', 'hr', 'admin'), getMyAttendanceRecords);
router.get('/history', authorizeRoles('employee', 'hr', 'admin'), getMyAttendanceRecords);       // alias
router.post('/regularization/request', authorizeRoles('employee', 'hr', 'admin'), requestRegularization);
router.post('/regularize', authorizeRoles('employee', 'hr', 'admin'), requestRegularization);    // alias
router.get('/regularization/my-status', authorizeRoles('employee', 'hr', 'admin'), getMyRegularizationStatus);

// HR endpoints
router.get('/all', authorizeRoles('hr', 'admin'), getAllAttendanceForManagers);
router.post('/manual/approve', authorizeRoles('hr', 'admin'), approveManualAttendance);
router.post('/regularization/approve', authorizeRoles('hr', 'admin'), approveRegularization);
router.get('/manual/pending', authorizeRoles('hr', 'admin'), getPendingManualRequests);
router.get('/regularization/pending', authorizeRoles('hr', 'admin'), getPendingRegularizationRequests);

// Admin/general (legacy CRUD if needed)
router.get('/', authorizeRoles('admin'), getAllAttendanceRecords);
router.get('/:id', authorizeRoles('admin'), getAttendanceRecordById);
router.post('/', authorizeRoles('admin'), createAttendanceRecord);
router.put('/:id', authorizeRoles('admin'), updateAttendanceRecord);
router.delete('/:id', authorizeRoles('admin'), deleteAttendanceRecord);

export default router;
