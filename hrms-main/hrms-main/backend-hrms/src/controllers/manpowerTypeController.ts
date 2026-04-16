
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

export const getAllManpowerTypes = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_manpower_types');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Manpower Types fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching manpower types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getManpowerTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_manpower_types WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manpower Type not found' });
    }
    res.json({ success: true, message: "Manpower Type fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching manpower type by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createManpowerType = async (req: Request, res: Response) => {
  const { name, description, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    // Check if manpower type with the same name already exists
    // Trim the name to avoid whitespace issues
    const trimmedName = name.trim();
    const [existingTypes]: any = await pool.query('SELECT * FROM hrms_manpower_types WHERE LOWER(TRIM(name)) = LOWER(?)', [trimmedName]);
    if (existingTypes.length > 0) {
      return res.status(409).json({ success: false, message: 'Manpower type name already exists' });
    }
    
    const [result]: any = await pool.query('INSERT INTO hrms_manpower_types (name, description, is_active) VALUES (?, ?, ?)', [name, description, isActive === undefined ? true : isActive]);
    const newManpowerType = { id: result.insertId, name, description, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Manpower Type created successfully', data: newManpowerType });
  } catch (error) {
    console.error('Error creating manpower type:', error);
    res.status(500).json({ success: false, message: 'Failed to create manpower type' });
  }
};

export const updateManpowerType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    // Check if manpower type with the same name already exists (excluding the current one)
    // Trim the name to avoid whitespace issues
    const trimmedName = name.trim();
    const [existingTypes]: any = await pool.query('SELECT * FROM hrms_manpower_types WHERE LOWER(TRIM(name)) = LOWER(?) AND id != ?', [trimmedName, id]);
    if (existingTypes.length > 0) {
      return res.status(409).json({ success: false, message: 'Manpower type name already exists' });
    }
    
    const [result]: any = await pool.query('UPDATE hrms_manpower_types SET name = ?, description = ?, is_active = ? WHERE id = ?', [name, description, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Manpower Type not found' });
    }
    const updatedManpowerType = { id: parseInt(id, 10), name, description, isActive };
    res.json({ success: true, message: 'Manpower Type updated successfully', data: updatedManpowerType });
  } catch (error) {
    console.error('Error updating manpower type:', error);
    res.status(500).json({ success: false, message: 'Failed to update manpower type' });
  }
};

export const deleteManpowerType = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_manpower_types WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Manpower Type not found' });
    }
    res.json({ success: true, message: 'Manpower Type deleted successfully' });
  } catch (error) {
    console.error('Error deleting manpower type:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
