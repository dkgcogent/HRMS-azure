import { Request, Response } from 'express';
import pool from '../db';

export const getAllAppraisalCategories = async (req: Request, res: Response) => {
  try {
    // Check if is_active column exists, if not, select all
    let query = 'SELECT * FROM hrms_appraisal_categories';
    try {
      const [check]: any = await pool.query('SHOW COLUMNS FROM hrms_appraisal_categories LIKE "is_active"');
      if (check.length > 0) {
        query += ' WHERE is_active = 1';
      }
    } catch (e) {
      // Column doesn't exist, use all records
    }
    query += ' ORDER BY name';
    
    const [rows]: any = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching appraisal categories:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch appraisal categories: ${error.message || 'Unknown error'}` 
    });
  }
};

export const getAppraisalCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT * FROM hrms_appraisal_categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appraisal category not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching appraisal category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appraisal category' });
  }
};

