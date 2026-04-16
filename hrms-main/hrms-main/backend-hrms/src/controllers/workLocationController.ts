
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

export const getAllWorkLocations = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_work_locations');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Work Locations fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching work locations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getWorkLocationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_work_locations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Work Location not found' });
    }
    res.json({ success: true, message: "Work Location fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching work location by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createWorkLocation = async (req: Request, res: Response) => {
  const { name, code, region, address, city, state, pincode, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_work_locations (name, code, region, address, city, state, pincode, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, code, region, address, city, state, pincode, isActive === undefined ? true : isActive]);
    const newWorkLocation = { id: result.insertId, name, code, region, address, city, state, pincode, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Work Location created successfully', data: newWorkLocation });
  } catch (error) {
    console.error('Error creating work location:', error);
    res.status(500).json({ success: false, message: 'Failed to create work location' });
  }
};

export const updateWorkLocation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, region, address, city, state, pincode, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_work_locations SET name = ?, code = ?, region = ?, address = ?, city = ?, state = ?, pincode = ?, is_active = ? WHERE id = ?', [name, code, region, address, city, state, pincode, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Work Location not found' });
    }
    const updatedWorkLocation = { id: parseInt(id, 10), name, code, region, address, city, state, pincode, isActive };
    res.json({ success: true, message: 'Work Location updated successfully', data: updatedWorkLocation });
  } catch (error) {
    console.error('Error updating work location:', error);
    res.status(500).json({ success: false, message: 'Failed to update work location' });
  }
};

export const deleteWorkLocation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_work_locations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Work Location not found' });
    }
    res.json({ success: true, message: 'Work Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting work location:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
