
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

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_shifts');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Shifts fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_shifts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }
    res.json({ success: true, message: "Shift fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching shift by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createShift = async (req: Request, res: Response) => {
  const { name, startTime, endTime, description, isActive } = req.body;
  if (!name || !startTime || !endTime) {
    return res.status(400).json({ success: false, message: 'Name, Start Time, and End Time are required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_shifts (name, start_time, end_time, description, is_active) VALUES (?, ?, ?, ?, ?)', [name, startTime, endTime, description, isActive === undefined ? true : isActive]);
    const newShift = { id: result.insertId, name, startTime, endTime, description, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Shift created successfully', data: newShift });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ success: false, message: 'Failed to create shift' });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, startTime, endTime, description, isActive } = req.body;
  if (!name || !startTime || !endTime) {
    return res.status(400).json({ success: false, message: 'Name, Start Time, and End Time are required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_shifts SET name = ?, start_time = ?, end_time = ?, description = ?, is_active = ? WHERE id = ?', [name, startTime, endTime, description, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }
    const updatedShift = { id: parseInt(id, 10), name, startTime, endTime, description, isActive };
    res.json({ success: true, message: 'Shift updated successfully', data: updatedShift });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ success: false, message: 'Failed to update shift' });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_shifts WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }
    res.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
