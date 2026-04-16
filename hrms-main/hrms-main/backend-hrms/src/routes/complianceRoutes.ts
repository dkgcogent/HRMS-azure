import express from 'express';
import {
    getAllEsiRecords, createEsiRecord, updateEsiRecord, deleteEsiRecord,
    getAllPfRecords, createPfRecord, updatePfRecord, deletePfRecord,
    getComplianceSummary, syncComplianceRecords
} from '../controllers/complianceController';

const router = express.Router();

// ESI Records
router.get('/esi', getAllEsiRecords);
router.post('/esi', createEsiRecord);
router.put('/esi/:id', updateEsiRecord);
router.delete('/esi/:id', deleteEsiRecord);

// PF Records
router.get('/pf', getAllPfRecords);
router.post('/pf', createPfRecord);
router.put('/pf/:id', updatePfRecord);
router.delete('/pf/:id', deletePfRecord);

// Summary & Sync
router.get('/summary', getComplianceSummary);
router.post('/sync', syncComplianceRecords);

export default router;
