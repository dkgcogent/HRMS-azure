
import { Request, Response } from 'express';
import pool from '../db';

export const getAllGoals = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_goals');
    res.json({ success: true, message: "Goals fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getGoalById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_goals WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, message: "Goal fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching goal by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  const { employee_id, title, description, due_date, status } = req.body;
  if (!employee_id || !title) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_goals (employee_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)', [employee_id, title, description, due_date, status]);
    res.status(201).json({ success: true, message: 'Goal created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employee_id, title, description, due_date, status } = req.body;
  if (!employee_id || !title) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_goals SET employee_id = ?, title = ?, description = ?, due_date = ?, status = ? WHERE id = ?', [employee_id, title, description, due_date, status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal updated successfully' });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_goals WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
