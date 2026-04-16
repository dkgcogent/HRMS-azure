
import { Request, Response } from 'express';
import pool from '../db';

export const getAllTemplateVariables = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_template_variables');
    res.json({ success: true, message: "Template Variables fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching template variables:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTemplateVariableById = async (req: Request, res: Response) => {
  const { template_id, variable_name } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_template_variables WHERE template_id = ? AND variable_name = ?', [template_id, variable_name]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template Variable not found' });
    }
    res.json({ success: true, message: "Template Variable fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching template variable by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTemplateVariable = async (req: Request, res: Response) => {
  const { template_id, variable_name } = req.body;
  if (!template_id || !variable_name) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_template_variables (template_id, variable_name) VALUES (?, ?)', [template_id, variable_name]);
    res.status(201).json({ success: true, message: 'Template Variable created successfully' });
  } catch (error) {
    console.error('Error creating template variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateTemplateVariable = async (req: Request, res: Response) => {
  const { template_id, variable_name } = req.params;
  const { new_variable_name } = req.body; // Assuming you might want to change the variable_name
  if (!template_id || !variable_name || !new_variable_name) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_template_variables SET variable_name = ? WHERE template_id = ? AND variable_name = ?', [new_variable_name, template_id, variable_name]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Template Variable not found' });
    }
    res.json({ success: true, message: 'Template Variable updated successfully' });
  } catch (error) {
    console.error('Error updating template variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteTemplateVariable = async (req: Request, res: Response) => {
  const { template_id, variable_name } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_template_variables WHERE template_id = ? AND variable_name = ?', [template_id, variable_name]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Template Variable not found' });
    }
    res.json({ success: true, message: 'Template Variable deleted successfully' });
  } catch (error) {
    console.error('Error deleting template variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
