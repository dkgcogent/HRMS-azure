import { Request, Response } from 'express';
import pool from '../db';

export const getAllExpenseCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_expense_categories');
    res.json({ success: true, message: "Expense Categories fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createExpenseCategory = async (req: Request, res: Response) => {
  const { name, description, is_active } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_expense_categories (name, description, is_active) VALUES (?, ?, ?)', [name, description, is_active === undefined ? true : is_active]);
    const newCategory = { id: result.insertId, name, description, is_active: is_active === undefined ? true : is_active };
    res.status(201).json({ success: true, message: 'Expense Category created successfully', data: newCategory });
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({ success: false, message: 'Failed to create expense category' });
  }
};