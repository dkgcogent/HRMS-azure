import { Request, Response } from 'express';
import pool from '../db';

export const getAllPayslips = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_payslips');
    res.json({ success: true, message: "Payslips fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPayslipById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_payslips WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    res.json({ success: true, message: "Payslip fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching payslip by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createPayslip = async (req: Request, res: Response) => {
  const { employee_id, month, year, gross_salary, net_salary, payroll_data } = req.body;
  if (!employee_id || !month || !year || !gross_salary || !net_salary) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const payrollDataStr = payroll_data ? JSON.stringify(payroll_data) : null;
    const [result]: any = await pool.query(
      'INSERT INTO hrms_payslips (employee_id, month, year, gross_salary, net_salary, payroll_data) VALUES (?, ?, ?, ?, ?, ?)',
      [employee_id, month, year, gross_salary, net_salary, payrollDataStr]
    );
    res.status(201).json({ success: true, message: 'Payslip created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating payslip:', error);
    res.status(500).json({ success: false, message: 'Failed to create payslip' });
  }
};

export const updatePayslip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employee_id, month, year, gross_salary, net_salary, payroll_data } = req.body;
  if (!employee_id || !month || !year || !gross_salary || !net_salary) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const payrollDataStr = payroll_data ? JSON.stringify(payroll_data) : null;
    const [result]: any = await pool.query(
      'UPDATE hrms_payslips SET employee_id = ?, month = ?, year = ?, gross_salary = ?, net_salary = ?, payroll_data = ? WHERE id = ?',
      [employee_id, month, year, gross_salary, net_salary, payrollDataStr, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    res.json({ success: true, message: 'Payslip updated successfully' });
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({ success: false, message: 'Failed to update payslip' });
  }
};

export const deletePayslip = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_payslips WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    res.json({ success: true, message: 'Payslip deleted successfully' });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payslip' });
  }
};