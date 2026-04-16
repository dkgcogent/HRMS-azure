
import { Request, Response } from 'express';
import pool from '../db';

export const getAllPolicies = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_policies');
    res.json({ success: true, message: "Policies fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPolicyById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_policies WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    res.json({ success: true, message: "Policy fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching policy by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createPolicy = async (req: Request, res: Response) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and Content are required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_policies (title, content) VALUES (?, ?)', [title, content]);
    res.status(201).json({ success: true, message: 'Policy created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updatePolicy = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and Content are required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_policies SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    res.json({ success: true, message: 'Policy updated successfully' });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deletePolicy = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_policies WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    res.json({ success: true, message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
