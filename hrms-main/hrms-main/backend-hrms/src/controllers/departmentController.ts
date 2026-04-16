
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

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_departments');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Departments fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_departments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: "Department fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching department by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  const { name, code, description, isActive } = req.body;
  console.log('Creating department with data:', { name, code, description, isActive });
  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and Code are required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_departments (name, code, description, is_active) VALUES (?, ?, ?, ?)', [name, code, description, isActive === undefined ? true : isActive]);
    const newDepartment = { id: result.insertId, name, code, description, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Department created successfully', data: newDepartment });
  } catch (error: any) {
    console.error('Error creating department:', error);
    const errorMessage = error?.sqlMessage || error?.message || 'Unknown database error';
    res.status(500).json({ success: false, message: `Failed to create department: ${errorMessage}` });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, description, isActive } = req.body;
  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and Code are required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_departments SET name = ?, code = ?, description = ?, is_active = ? WHERE id = ?', [name, code, description, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    const updatedDepartment = { id: parseInt(id, 10), name, code, description, isActive };
    res.json({ success: true, message: 'Department updated successfully', data: updatedDepartment });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_departments WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
