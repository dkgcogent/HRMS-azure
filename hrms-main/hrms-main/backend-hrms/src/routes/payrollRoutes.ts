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
  deletePayslip
} from '../controllers/payslipController';
import { generatePayslipPdf } from '../utils/payslipPdfGenerator';

const router = express.Router();

// Salary Components Routes
router.get('/components', getAllSalaryComponents);
router.post('/components', createSalaryComponent);

// Employee Salary Routes
router.get('/employee-salary/:employeeId', getEmployeeSalary);
router.put('/employee-salary', updateEmployeeSalary); // Use PUT for upsert

// Payslip Routes
router.get('/', getAllPayslips);
router.get('/:id', getPayslipById);
router.get('/:id/pdf', (req, res) => generatePayslipPdf(parseInt(req.params.id), res));
router.post('/', createPayslip);
router.put('/:id', updatePayslip);
router.delete('/:id', deletePayslip);

export default router;