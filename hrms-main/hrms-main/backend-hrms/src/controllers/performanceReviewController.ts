
import { Request, Response } from 'express';
import pool from '../db';

export const getAllPerformanceReviews = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_performance_reviews');
    res.json({ success: true, message: "Performance Reviews fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPerformanceReviewById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_performance_reviews WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Performance Review not found' });
    }
    res.json({ success: true, message: "Performance Review fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching performance review by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createPerformanceReview = async (req: Request, res: Response) => {
  const { employee_id, reviewer_id, review_date, rating, comments } = req.body;
  if (!employee_id || !reviewer_id || !review_date || !rating) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_performance_reviews (employee_id, reviewer_id, review_date, rating, comments) VALUES (?, ?, ?, ?, ?)', [employee_id, reviewer_id, review_date, rating, comments]);
    res.status(201).json({ success: true, message: 'Performance Review created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating performance review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updatePerformanceReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employee_id, reviewer_id, review_date, rating, comments } = req.body;
  if (!employee_id || !reviewer_id || !review_date || !rating) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_performance_reviews SET employee_id = ?, reviewer_id = ?, review_date = ?, rating = ?, comments = ? WHERE id = ?', [employee_id, reviewer_id, review_date, rating, comments, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Performance Review not found' });
    }
    res.json({ success: true, message: 'Performance Review updated successfully' });
  } catch (error) {
    console.error('Error updating performance review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deletePerformanceReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_performance_reviews WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Performance Review not found' });
    }
    res.json({ success: true, message: 'Performance Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting performance review:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
