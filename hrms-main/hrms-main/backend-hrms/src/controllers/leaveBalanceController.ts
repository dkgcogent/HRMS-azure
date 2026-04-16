
import { Request, Response } from 'express';
import pool from '../db';

export const getAllLeaveBalances = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_leave_balances');
    res.json({ success: true, message: "Leave Balances fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLeaveBalanceById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_leave_balances WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave Balance not found' });
    }
    res.json({ success: true, message: "Leave Balance fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching leave balance by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createLeaveBalance = async (req: Request, res: Response) => {
  const { employee_id, leave_type_id, balance } = req.body;
  if (!employee_id || !leave_type_id || balance === undefined) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_leave_balances (employee_id, leave_type_id, balance) VALUES (?, ?, ?)', [employee_id, leave_type_id, balance]);
    res.status(201).json({ success: true, message: 'Leave Balance created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating leave balance:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateLeaveBalance = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employee_id, leave_type_id, balance } = req.body;
  if (!employee_id || !leave_type_id || balance === undefined) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_leave_balances SET employee_id = ?, leave_type_id = ?, balance = ? WHERE id = ?', [employee_id, leave_type_id, balance, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave Balance not found' });
    }
    res.json({ success: true, message: 'Leave Balance updated successfully' });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteLeaveBalance = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_leave_balances WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave Balance not found' });
    }
    res.json({ success: true, message: 'Leave Balance deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave balance:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
