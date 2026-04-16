
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

export const getAllPaymentModes = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_payment_modes');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Payment Modes fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching payment modes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPaymentModeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_payment_modes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment Mode not found' });
    }
    res.json({ success: true, message: "Payment Mode fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching payment mode by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createPaymentMode = async (req: Request, res: Response) => {
  const { name, description, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_payment_modes (name, description, is_active) VALUES (?, ?, ?)', [name, description, isActive === undefined ? true : isActive]);
    const newPaymentMode = { id: result.insertId, name, description, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Payment Mode created successfully', data: newPaymentMode });
  } catch (error) {
    console.error('Error creating payment mode:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment mode' });
  }
};

export const updatePaymentMode = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_payment_modes SET name = ?, description = ?, is_active = ? WHERE id = ?', [name, description, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payment Mode not found' });
    }
    const updatedPaymentMode = { id: parseInt(id, 10), name, description, isActive };
    res.json({ success: true, message: 'Payment Mode updated successfully', data: updatedPaymentMode });
  } catch (error) {
    console.error('Error updating payment mode:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment mode' });
  }
};

export const deletePaymentMode = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_payment_modes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payment Mode not found' });
    }
    res.json({ success: true, message: 'Payment Mode deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment mode:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
