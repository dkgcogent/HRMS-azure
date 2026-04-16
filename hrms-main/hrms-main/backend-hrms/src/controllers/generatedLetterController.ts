
import { Request, Response } from 'express';
import pool from '../db';

export const getAllGeneratedLetters = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_generated_letters');
    res.json({ success: true, message: "Generated Letters fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching generated letters:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getGeneratedLetterById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_generated_letters WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Generated Letter not found' });
    }
    res.json({ success: true, message: "Generated Letter fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching generated letter by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createGeneratedLetter = async (req: Request, res: Response) => {
  const { template_id, employee_id, content, additional_content, recipient_email, subject, status } = req.body;
  if (!template_id || !employee_id || !content) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO hrms_generated_letters (template_id, employee_id, content, additional_content, recipient_email, subject, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [template_id, employee_id, content, additional_content, recipient_email, subject, status]
    );
    res.status(201).json({ success: true, message: 'Generated Letter created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating generated letter:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateGeneratedLetter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { template_id, employee_id, content, additional_content, recipient_email, subject, status } = req.body;
  if (!template_id || !employee_id || !content) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query(
      'UPDATE hrms_generated_letters SET template_id = ?, employee_id = ?, content = ?, additional_content = ?, recipient_email = ?, subject = ?, status = ? WHERE id = ?',
      [template_id, employee_id, content, additional_content, recipient_email, subject, status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Generated Letter not found' });
    }
    res.json({ success: true, message: 'Generated Letter updated successfully' });
  } catch (error) {
    console.error('Error updating generated letter:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteGeneratedLetter = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_generated_letters WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Generated Letter not found' });
    }
    res.json({ success: true, message: 'Generated Letter deleted successfully' });
  } catch (error) {
    console.error('Error deleting generated letter:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
