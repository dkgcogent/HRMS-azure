
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

export const getAllBanks = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_banks');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Banks fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBankById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_banks WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }
    res.json({ success: true, message: "Bank fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching bank by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createBank = async (req: Request, res: Response) => {
  const { name, ifscCode, branchName, address, city, state, isActive } = req.body;
  if (!name || !ifscCode) {
    return res.status(400).json({ success: false, message: 'Name and IFSC Code are required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_banks (name, ifsc_code, branch_name, address, city, state, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, ifscCode, branchName || null, address || null, city || null, state || null, isActive === undefined ? true : isActive]);
    const newBank = { id: result.insertId, name, ifscCode, branchName, address, city, state, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Bank created successfully', data: newBank });
  } catch (error: any) {
    console.error('Error creating bank:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Bank with this name or IFSC Code already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create bank' });
  }
};

export const updateBank = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, ifscCode, branchName, address, city, state, isActive } = req.body;
  if (!name || !ifscCode) {
    return res.status(400).json({ success: false, message: 'Name and IFSC Code are required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_banks SET name = ?, ifsc_code = ?, branch_name = ?, address = ?, city = ?, state = ?, is_active = ? WHERE id = ?', [name, ifscCode, branchName || null, address || null, city || null, state || null, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }
    const updatedBank = { id: parseInt(id, 10), name, ifscCode, branchName, address, city, state, isActive };
    res.json({ success: true, message: 'Bank updated successfully', data: updatedBank });
  } catch (error: any) {
    console.error('Error updating bank:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Bank with this name or IFSC Code already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update bank' });
  }
};

export const deleteBank = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_banks WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }
    res.json({ success: true, message: 'Bank deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
