
import { Request, Response } from 'express';
import pool from '../db';

export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_feedback');
    res.json({ success: true, message: "Feedback fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getFeedbackById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_feedback WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.json({ success: true, message: "Feedback fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching feedback by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createFeedback = async (req: Request, res: Response) => {
  const { employee_id, reviewer_id, feedback } = req.body;
  if (!employee_id || !reviewer_id || !feedback) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_feedback (employee_id, reviewer_id, feedback) VALUES (?, ?, ?)', [employee_id, reviewer_id, feedback]);
    res.status(201).json({ success: true, message: 'Feedback created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateFeedback = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employee_id, reviewer_id, feedback } = req.body;
  if (!employee_id || !reviewer_id || !feedback) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_feedback SET employee_id = ?, reviewer_id = ?, feedback = ? WHERE id = ?', [employee_id, reviewer_id, feedback, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.json({ success: true, message: 'Feedback updated successfully' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_feedback WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
