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
  updatePayslip
} from '../controllers/payslipController';

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
router.post('/', createPayslip);
router.put('/:id', updatePayslip);

export default router;