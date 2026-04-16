import { Request, Response } from 'express';
import pool from '../db';

export const getEmployeeSalary = async (req: Request, res: Response) => {
  const { employeeId } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM employee_salary WHERE employee_id = ?', [employeeId]);
    res.json({ success: true, message: "Employee Salary fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching employee salary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateEmployeeSalary = async (req: Request, res: Response) => {
  const { employee_id, salary_component_id, amount } = req.body;
  try {
    const [result]: any = await pool.query(
      'INSERT INTO employee_salary (employee_id, salary_component_id, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = ?',
      [employee_id, salary_component_id, amount, amount]
    );
    res.status(200).json({ success: true, message: 'Employee Salary updated successfully', data: result });
  } catch (error) {
    console.error('Error updating employee salary:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee salary' });
  }
};