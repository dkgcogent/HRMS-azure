
import { Request, Response } from 'express';
import pool from '../db';

export const getAllLetterTemplateVariables = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_letter_template_variables');
    res.json({ success: true, message: "Letter Template Variables fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching letter template variables:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLetterTemplateVariableById = async (req: Request, res: Response) => {
  const { template_id, variable_name } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_letter_template_variables WHERE template_id = ? AND variable_name = ?', [template_id, variable_name]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Letter Template Variable not found' });
    }
    res.json({ success: true, message: "Letter Template Variable fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching letter template variable by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createLetterTemplateVariable = async (req: Request, res: Response) => {
  const { template_id, variable_name } = req.body;
  if (!template_id || !variable_name) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_letter_template_variables (template_id, variable_name) VALUES (?, ?)', [template_id, variable_name]);
    res.status(201).json({ success: true, message: 'Letter Template Variable created successfully' });
  } catch (error) {
    console.error('Error creating letter template variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteLetterTemplateVariable = async (req: Request, res: Response) => {
  const { template_id, variable_name } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_letter_template_variables WHERE template_id = ? AND variable_name = ?', [template_id, variable_name]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Letter Template Variable not found' });
    }
    res.json({ success: true, message: 'Letter Template Variable deleted successfully' });
  } catch (error) {
    console.error('Error deleting letter template variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
