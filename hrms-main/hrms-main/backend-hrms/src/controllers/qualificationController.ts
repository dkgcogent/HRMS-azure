
import { Request, Response } from 'express';
import pool from '../db';

// Utility function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Utility function to convert database row (snake_case) to camelCase object
const convertRowToCamelCase = (row: any): any => {
  if (!row) return row;
  const camelCaseRow: any = {};
  for (const key in row) {
    if (row.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      // Convert MySQL boolean (1/0) to JavaScript boolean for isActive field
      if (camelKey === 'isActive') {
        camelCaseRow[camelKey] = row[key] === 1;
      } else {
        camelCaseRow[camelKey] = row[key];
      }
    }
  }
  return camelCaseRow;
};

// Utility function to convert array of rows to camelCase
const convertRowsToCamelCase = (rows: any[]): any[] => {
  return rows.map(row => convertRowToCamelCase(row));
};

export const getAllQualifications = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_qualifications');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Qualifications fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching qualifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getQualificationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_qualifications WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Qualification not found' });
    }
    res.json({ success: true, message: "Qualification fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching qualification by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createQualification = async (req: Request, res: Response) => {
  const { name, code, description, level, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_qualifications (name, code, description, level, is_active) VALUES (?, ?, ?, ?, ?)', [name, code, description, level, isActive === undefined ? true : isActive]);
    const newQualification = { id: result.insertId, name, code, description, level, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Qualification created successfully', data: newQualification });
  } catch (error) {
    console.error('Error creating qualification:', error);
    res.status(500).json({ success: false, message: 'Failed to create qualification' });
  }
};

export const updateQualification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, description, level, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_qualifications SET name = ?, code = ?, description = ?, level = ?, is_active = ? WHERE id = ?', [name, code, description, level, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Qualification not found' });
    }
    const updatedQualification = { id: parseInt(id, 10), name, code, description, level, isActive };
    res.json({ success: true, message: 'Qualification updated successfully', data: updatedQualification });
  } catch (error) {
    console.error('Error updating qualification:', error);
    res.status(500).json({ success: false, message: 'Failed to update qualification' });
  }
};

export const deleteQualification = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_qualifications WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Qualification not found' });
    }
    res.json({ success: true, message: 'Qualification deleted successfully' });
  } catch (error) {
    console.error('Error deleting qualification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
