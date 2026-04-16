
import { Request, Response } from 'express';
import pool from '../db';

export const getAllTemplateSpecificRecipients = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_template_specific_recipients');
    res.json({ success: true, message: "Template Specific Recipients fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching template specific recipients:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTemplateSpecificRecipientById = async (req: Request, res: Response) => {
  const { template_id, employee_id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_template_specific_recipients WHERE template_id = ? AND employee_id = ?', [template_id, employee_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template Specific Recipient not found' });
    }
    res.json({ success: true, message: "Template Specific Recipient fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching template specific recipient by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTemplateSpecificRecipient = async (req: Request, res: Response) => {
  const { template_id, employee_id } = req.body;
  if (!template_id || !employee_id) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_template_specific_recipients (template_id, employee_id) VALUES (?, ?)', [template_id, employee_id]);
    res.status(201).json({ success: true, message: 'Template Specific Recipient created successfully' });
  } catch (error) {
    console.error('Error creating template specific recipient:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteTemplateSpecificRecipient = async (req: Request, res: Response) => {
  const { template_id, employee_id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_template_specific_recipients WHERE template_id = ? AND employee_id = ?', [template_id, employee_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Template Specific Recipient not found' });
    }
    res.json({ success: true, message: 'Template Specific Recipient deleted successfully' });
  } catch (error) {
    console.error('Error deleting template specific recipient:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
