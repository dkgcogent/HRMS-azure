
import express from 'express';
import { getAllPolicies, getPolicyById, createPolicy, updatePolicy, deletePolicy } from '../controllers/policyController';

const router = express.Router();

// Policies Routes
router.get('/', getAllPolicies);
router.get('/:id', getPolicyById);
router.post('/', createPolicy);
router.put('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

export default router;
