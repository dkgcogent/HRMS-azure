
import express from 'express';
import { getAllInsurancePolicies, getInsurancePolicyById, createInsurancePolicy, updateInsurancePolicy, deleteInsurancePolicy } from '../controllers/insurancePolicyController';
import { getAllPolicyBeneficiaries, getPolicyBeneficiaryById, createPolicyBeneficiary, updatePolicyBeneficiary, deletePolicyBeneficiary } from '../controllers/policyBeneficiaryController';
import { getAllPolicyFamilyCoverages, getPolicyFamilyCoverageById, createPolicyFamilyCoverage, updatePolicyFamilyCoverage, deletePolicyFamilyCoverage } from '../controllers/policyFamilyCoverageController';
import { getAllInsuranceClaims, getInsuranceClaimById, createInsuranceClaim, updateInsuranceClaim, deleteInsuranceClaim } from '../controllers/insuranceClaimController';
import { getAllClaimDocuments, getClaimDocumentById, createClaimDocument, updateClaimDocument, deleteClaimDocument } from '../controllers/claimDocumentController';
import { getAllGratuityRecords, getGratuityRecordById, createGratuityRecord, updateGratuityRecord, deleteGratuityRecord, syncGratuityRecords } from '../controllers/gratuityRecordController';

const router = express.Router();

// Insurance Policies Routes
router.get('/insurance-policies', getAllInsurancePolicies);
router.get('/insurance-policies/:id', getInsurancePolicyById);
router.post('/insurance-policies', createInsurancePolicy);
router.put('/insurance-policies/:id', updateInsurancePolicy);
router.delete('/insurance-policies/:id', deleteInsurancePolicy);

// Policy Beneficiaries Routes
router.get('/policy-beneficiaries', getAllPolicyBeneficiaries);
router.get('/policy-beneficiaries/:id', getPolicyBeneficiaryById);
router.post('/policy-beneficiaries', createPolicyBeneficiary);
router.put('/policy-beneficiaries/:id', updatePolicyBeneficiary);
router.delete('/policy-beneficiaries/:id', deletePolicyBeneficiary);

// Policy Family Coverages Routes
router.get('/policy-family-coverages', getAllPolicyFamilyCoverages);
router.get('/policy-family-coverages/:id', getPolicyFamilyCoverageById);
router.post('/policy-family-coverages', createPolicyFamilyCoverage);
router.put('/policy-family-coverages/:id', updatePolicyFamilyCoverage);
router.delete('/policy-family-coverages/:id', deletePolicyFamilyCoverage);

// Insurance Claims Routes
router.get('/insurance-claims', getAllInsuranceClaims);
router.get('/insurance-claims/:id', getInsuranceClaimById);
router.post('/insurance-claims', createInsuranceClaim);
router.put('/insurance-claims/:id', updateInsuranceClaim);
router.delete('/insurance-claims/:id', deleteInsuranceClaim);

// Claim Documents Routes
router.get('/claim-documents', getAllClaimDocuments);
router.get('/claim-documents/:claim_id/:document_path', getClaimDocumentById);
router.post('/claim-documents', createClaimDocument);
router.put('/claim-documents/:claim_id/:document_path', updateClaimDocument);
router.delete('/claim-documents/:claim_id/:document_path', deleteClaimDocument);

// Gratuity Records Routes
router.get('/gratuity-records', getAllGratuityRecords);
router.get('/gratuity-records/:id', getGratuityRecordById);
router.post('/gratuity-records', createGratuityRecord);
router.put('/gratuity-records/:id', updateGratuityRecord);
router.delete('/gratuity-records/:id', deleteGratuityRecord);
router.post('/sync-gratuity-records', syncGratuityRecords);

export default router;
