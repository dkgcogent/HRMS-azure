
import { Request, Response } from 'express';
import pool from '../db';

export const getAllLetterTemplates = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_letter_templates');
    res.json({ success: true, message: "Letter Templates fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching letter templates:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLetterTemplateById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_letter_templates WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Letter Template not found' });
    }
    res.json({ success: true, message: "Letter Template fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching letter template by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createLetterTemplate = async (req: Request, res: Response) => {
  const { name, type, category, template_content, is_active } = req.body;
  if (!name || !type || !category || !template_content) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_letter_templates (name, type, category, template_content, is_active) VALUES (?, ?, ?, ?, ?)', [name, type, category, template_content, is_active]);
    res.status(201).json({ success: true, message: 'Letter Template created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating letter template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateLetterTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type, category, template_content, is_active } = req.body;
  if (!name || !type || !category || !template_content) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_letter_templates SET name = ?, type = ?, category = ?, template_content = ?, is_active = ? WHERE id = ?', [name, type, category, template_content, is_active, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Letter Template not found' });
    }
    res.json({ success: true, message: 'Letter Template updated successfully' });
  } catch (error) {
    console.error('Error updating letter template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteLetterTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_letter_templates WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Letter Template not found' });
    }
    res.json({ success: true, message: 'Letter Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting letter template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
