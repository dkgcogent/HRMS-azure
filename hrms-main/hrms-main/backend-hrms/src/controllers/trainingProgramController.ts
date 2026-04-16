
import { Request, Response } from 'express';
import pool from '../db';

export const getAllTrainingPrograms = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_training_programs');
    res.json({ success: true, message: "Training Programs fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching training programs:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTrainingProgramById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_training_programs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Training Program not found' });
    }
    res.json({ success: true, message: "Training Program fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching training program by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTrainingProgram = async (req: Request, res: Response) => {
  const { title, description, category, start_date, end_date, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO hrms_training_programs (title, description, category, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || null, category || 'General', start_date || null, end_date || null, status || 'SCHEDULED']
    );
    res.status(201).json({ success: true, message: 'Training Program created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating training program:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateTrainingProgram = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, category, start_date, end_date, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  try {
    const [result]: any = await pool.query(
      'UPDATE hrms_training_programs SET title = ?, description = ?, category = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?',
      [title, description || null, category || 'General', start_date || null, end_date || null, status || 'SCHEDULED', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Training Program not found' });
    }
    res.json({ success: true, message: 'Training Program updated successfully' });
  } catch (error) {
    console.error('Error updating training program:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteTrainingProgram = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_training_programs WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Training Program not found' });
    }
    res.json({ success: true, message: 'Training Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting training program:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
