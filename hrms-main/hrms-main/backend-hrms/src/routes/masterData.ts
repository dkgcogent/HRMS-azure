import express from 'express';
import { getAllManpowerTypes, getManpowerTypeById, createManpowerType, updateManpowerType, deleteManpowerType } from '../controllers/manpowerTypeController';
import { getAllDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { getAllDesignations, getDesignationById, createDesignation, updateDesignation, deleteDesignation } from '../controllers/designationController';
import { getAllShifts, getShiftById, createShift, updateShift, deleteShift } from '../controllers/shiftController';
import { getAllWorkLocations, getWorkLocationById, createWorkLocation, updateWorkLocation, deleteWorkLocation } from '../controllers/workLocationController';
import { getAllBanks, getBankById, createBank, updateBank, deleteBank } from '../controllers/bankController';
import { getAllPaymentModes, getPaymentModeById, createPaymentMode, updatePaymentMode, deletePaymentMode } from '../controllers/paymentModeController';
import { getAllQualifications, getQualificationById, createQualification, updateQualification, deleteQualification } from '../controllers/qualificationController';
import { getAllDocumentTypes, getDocumentTypeById, createDocumentType, updateDocumentType, deleteDocumentType } from '../controllers/documentTypeController';
import { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController';
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/projectController';

const router = express.Router();

// Manpower Types Routes
router.get('/manpower-types', getAllManpowerTypes);
router.get('/manpower-types/:id', getManpowerTypeById);
router.post('/manpower-types', createManpowerType);
router.put('/manpower-types/:id', updateManpowerType);
router.delete('/manpower-types/:id', deleteManpowerType);

// Departments Routes
router.get('/departments', getAllDepartments);
router.get('/departments/:id', getDepartmentById);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Designations Routes
router.get('/designations', getAllDesignations);
router.get('/designations/:id', getDesignationById);
router.post('/designations', createDesignation);
router.put('/designations/:id', updateDesignation);
router.delete('/designations/:id', deleteDesignation);

// Shifts Routes
router.get('/shifts', getAllShifts);
router.get('/shifts/:id', getShiftById);
router.post('/shifts', createShift);
router.put('/shifts/:id', updateShift);
router.delete('/shifts/:id', deleteShift);

// Work Locations Routes
router.get('/work-locations', getAllWorkLocations);
router.get('/work-locations/:id', getWorkLocationById);
router.post('/work-locations', createWorkLocation);
router.put('/work-locations/:id', updateWorkLocation);
router.delete('/work-locations/:id', deleteWorkLocation);

// Banks Routes
router.get('/banks', getAllBanks);
router.get('/banks/:id', getBankById);
router.post('/banks', createBank);
router.put('/banks/:id', updateBank);
router.delete('/banks/:id', deleteBank);

// Payment Modes Routes
router.get('/payment-modes', getAllPaymentModes);
router.get('/payment-modes/:id', getPaymentModeById);
router.post('/payment-modes', createPaymentMode);
router.put('/payment-modes/:id', updatePaymentMode);
router.delete('/payment-modes/:id', deletePaymentMode);

// Qualifications Routes
router.get('/qualifications', getAllQualifications);
router.get('/qualifications/:id', getQualificationById);
router.post('/qualifications', createQualification);
router.put('/qualifications/:id', updateQualification);
router.delete('/qualifications/:id', deleteQualification);

// Document Types Routes
router.get('/document-types', getAllDocumentTypes);
router.get('/document-types/:id', getDocumentTypeById);
router.post('/document-types', createDocumentType);
router.put('/document-types/:id', updateDocumentType);
router.delete('/document-types/:id', deleteDocumentType);

// Customers Routes
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Projects Routes
router.get('/projects', getAllProjects);
router.get('/projects/:id', getProjectById);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

export default router;