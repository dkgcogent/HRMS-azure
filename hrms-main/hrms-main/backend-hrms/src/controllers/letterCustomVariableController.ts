
import { Request, Response } from 'express';
import pool from '../db';

export const getAllLetterCustomVariables = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_letter_custom_variables');
    res.json({ success: true, message: "Letter Custom Variables fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching letter custom variables:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLetterCustomVariableById = async (req: Request, res: Response) => {
  const { letter_id, variable_name } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_letter_custom_variables WHERE letter_id = ? AND variable_name = ?', [letter_id, variable_name]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Letter Custom Variable not found' });
    }
    res.json({ success: true, message: "Letter Custom Variable fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching letter custom variable by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createLetterCustomVariable = async (req: Request, res: Response) => {
  const { letter_id, variable_name, variable_value } = req.body;
  if (!letter_id || !variable_name || !variable_value) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_letter_custom_variables (letter_id, variable_name, variable_value) VALUES (?, ?, ?)', [letter_id, variable_name, variable_value]);
    res.status(201).json({ success: true, message: 'Letter Custom Variable created successfully' });
  } catch (error) {
    console.error('Error creating letter custom variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateLetterCustomVariable = async (req: Request, res: Response) => {
  const { letter_id, variable_name } = req.params;
  const { variable_value } = req.body;
  if (!letter_id || !variable_name || !variable_value) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_letter_custom_variables SET variable_value = ? WHERE letter_id = ? AND variable_name = ?', [variable_value, letter_id, variable_name]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Letter Custom Variable not found' });
    }
    res.json({ success: true, message: 'Letter Custom Variable updated successfully' });
  } catch (error) {
    console.error('Error updating letter custom variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteLetterCustomVariable = async (req: Request, res: Response) => {
  const { letter_id, variable_name } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_letter_custom_variables WHERE letter_id = ? AND variable_name = ?', [letter_id, variable_name]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Letter Custom Variable not found' });
    }
    res.json({ success: true, message: 'Letter Custom Variable deleted successfully' });
  } catch (error) {
    console.error('Error deleting letter custom variable:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
