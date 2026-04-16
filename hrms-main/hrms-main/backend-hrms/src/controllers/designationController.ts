
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
      if (camelKey === 'isActive' || key === 'is_active') {
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

export const getAllDesignations = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT d.id, d.name, d.code, d.description, d.department_id, d.level, d.is_active, dept.name as department_name
      FROM hrms_designations d
      LEFT JOIN hrms_departments dept ON d.department_id = dept.id
    `);
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Designations fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching designations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDesignationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_designations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }
    res.json({ success: true, message: "Designation fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching designation by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createDesignation = async (req: Request, res: Response) => {
  const { name, code, description, departmentId, level, isActive } = req.body;
  if (!name || !departmentId) {
    return res.status(400).json({ success: false, message: 'Name and Department ID are required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_designations (name, code, description, department_id, level, is_active) VALUES (?, ?, ?, ?, ?, ?)', [name, code, description, departmentId, level, isActive === undefined ? true : isActive]);
    const newDesignation = { id: result.insertId, name, code, description, departmentId, level, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Designation created successfully', data: newDesignation });
  } catch (error) {
    console.error('Error creating designation:', error);
    res.status(500).json({ success: false, message: 'Failed to create designation' });
  }
};

export const updateDesignation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, description, departmentId, level, isActive } = req.body;
  if (!name || !departmentId) {
    return res.status(400).json({ success: false, message: 'Name and Department ID are required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_designations SET name = ?, code = ?, description = ?, department_id = ?, level = ?, is_active = ? WHERE id = ?', [name, code, description, departmentId, level, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }
    const updatedDesignation = { id: parseInt(id, 10), name, code, description, departmentId, level, isActive };
    res.json({ success: true, message: 'Designation updated successfully', data: updatedDesignation });
  } catch (error) {
    console.error('Error updating designation:', error);
    res.status(500).json({ success: false, message: 'Failed to update designation' });
  }
};

export const deleteDesignation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_designations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }
    res.json({ success: true, message: 'Designation deleted successfully' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
