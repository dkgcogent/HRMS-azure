import { Request, Response } from 'express';
import pool from '../db';

export const getAllLeaveTypes = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_leave_types');
    res.json({ success: true, message: "Leave Types fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLeaveTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_leave_types WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave Type not found' });
    }
    res.json({ success: true, message: "Leave Type fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching leave type by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createLeaveType = async (req: Request, res: Response) => {
  const { name, description, is_active } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_leave_types (name, description, is_active) VALUES (?, ?, ?)', [name, description, is_active === undefined ? true : is_active]);
    const newLeaveType = { id: result.insertId, name, description, is_active: is_active === undefined ? true : is_active };
    res.status(201).json({ success: true, message: 'Leave Type created successfully', data: newLeaveType });
  } catch (error) {
    console.error('Error creating leave type:', error);
    res.status(500).json({ success: false, message: 'Failed to create leave type' });
  }
};

export const updateLeaveType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_leave_types SET name = ?, description = ?, is_active = ? WHERE id = ?', [name, description, is_active, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave Type not found' });
    }
    const updatedLeaveType = { id: parseInt(id, 10), name, description, is_active };
    res.json({ success: true, message: 'Leave Type updated successfully', data: updatedLeaveType });
  } catch (error) {
    console.error('Error updating leave type:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave type' });
  }
};

export const deleteLeaveType = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_leave_types WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave Type not found' });
    }
    res.json({ success: true, message: 'Leave Type deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave type:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};