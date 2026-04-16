import { Request, Response } from 'express';
import pool from '../db';

export const getAllSalaryComponents = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_salary_components');
    res.json({ success: true, message: "Salary Components fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching salary components:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createSalaryComponent = async (req: Request, res: Response) => {
  const { name, type, is_active } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, message: 'Name and Type are required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_salary_components (name, type, is_active) VALUES (?, ?, ?)', [name, type, is_active === undefined ? true : is_active]);
    const newComponent = { id: result.insertId, name, type, is_active: is_active === undefined ? true : is_active };
    res.status(201).json({ success: true, message: 'Salary Component created successfully', data: newComponent });
  } catch (error) {
    console.error('Error creating salary component:', error);
    res.status(500).json({ success: false, message: 'Failed to create salary component' });
  }
};