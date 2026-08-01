import express from 'express';
import {
  getKRATemplates,
  getKRATemplateById,
  createKRATemplate,
  updateKRATemplate,
  deleteKRATemplate,
  getKRAAssignments,
  assignKRATemplate,
  removeKRAAssignment,
  getKRAAuditLogs,
  getMyKRA,
  saveMyKRAScores
} from '../controllers/kraController';

const router = express.Router();

// Templates
router.get('/templates', getKRATemplates);
router.get('/templates/:id', getKRATemplateById);
router.post('/templates', createKRATemplate);
router.put('/templates/:id', updateKRATemplate);
router.delete('/templates/:id', deleteKRATemplate);

// Assignments
router.get('/assignments', getKRAAssignments);
router.post('/assignments', assignKRATemplate);
router.delete('/assignments/:id', removeKRAAssignment);

// Self-Service KRA
router.get('/my-kra', getMyKRA);
router.post('/my-kra/save', saveMyKRAScores);

// Logs
router.get('/audit-logs', getKRAAuditLogs);

export default router;
