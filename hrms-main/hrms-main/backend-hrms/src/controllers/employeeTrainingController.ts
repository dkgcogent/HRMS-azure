
import { Request, Response } from 'express';
import pool from '../db';

export const getAllEmployeeTraining = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employee_training');
    res.json({ success: true, message: "Employee Training fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching employee training:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeeTrainingById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM employee_training WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee Training not found' });
    }
    res.json({ success: true, message: "Employee Training fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching employee training by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEmployeeTraining = async (req: Request, res: Response) => {
  const { employee_id, training_program_id, status } = req.body;
  if (!employee_id || !training_program_id || !status) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO employee_training (employee_id, training_program_id, status) VALUES (?, ?, ?)', [employee_id, training_program_id, status]);
    res.status(201).json({ success: true, message: 'Employee Training created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating employee training:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateEmployeeTraining = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employee_id, training_program_id, status } = req.body;
  if (!employee_id || !training_program_id || !status) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE employee_training SET employee_id = ?, training_program_id = ?, status = ? WHERE id = ?', [employee_id, training_program_id, status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee Training not found' });
    }
    res.json({ success: true, message: 'Employee Training updated successfully' });
  } catch (error) {
    console.error('Error updating employee training:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteEmployeeTraining = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM employee_training WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee Training not found' });
    }
    res.json({ success: true, message: 'Employee Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee training:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
