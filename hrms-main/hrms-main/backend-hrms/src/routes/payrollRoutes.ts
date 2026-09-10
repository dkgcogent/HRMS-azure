import express from 'express';
import {
  getAllSalaryComponents,
  createSalaryComponent
} from '../controllers/salaryComponentController';
import {
  getEmployeeSalary,
  updateEmployeeSalary
} from '../controllers/employeeSalaryController';
import {
  getAllPayslips,
  getPayslipById,
  createPayslip,
  updatePayslip,
  deletePayslip,
  getPayslipsByEmployee
} from '../controllers/payslipController';
import {
  getPaymentSheets,
  getPaymentSheetById,
  createOrUpdatePaymentSheet,
  updatePaymentSheetById,
  sendForApproval,
  approvePaymentSheet,
  rejectPaymentSheet,
  deletePaymentSheet
} from '../controllers/paymentSheetController';
import { generatePayslipPdf } from '../utils/payslipPdfGenerator';

const router = express.Router();

// Salary Components Routes
router.get('/components', getAllSalaryComponents);
router.post('/components', createSalaryComponent);

// Employee Salary Routes
router.get('/employee-salary/:employeeId', getEmployeeSalary);
router.put('/employee-salary', updateEmployeeSalary); // Use PUT for upsert

// Payment Sheet Routes
router.get('/payment-sheets', getPaymentSheets);
router.get('/payment-sheets/:id', getPaymentSheetById);
router.post('/payment-sheets', createOrUpdatePaymentSheet);
router.put('/payment-sheets/:id', updatePaymentSheetById);
router.post('/payment-sheets/:id/send-approval', sendForApproval);
router.post('/payment-sheets/:id/approve', approvePaymentSheet);
router.post('/payment-sheets/:id/reject', rejectPaymentSheet);
router.delete('/payment-sheets/:id', deletePaymentSheet);

// Payslip Routes
router.get('/', getAllPayslips);
router.get('/employee/:employeeId', getPayslipsByEmployee);
router.get('/:id', getPayslipById);
router.get('/:id/pdf', (req, res) => generatePayslipPdf(parseInt(req.params.id), res));
router.post('/', createPayslip);
router.put('/:id', updatePayslip);
router.delete('/:id', deletePayslip);

export default router;