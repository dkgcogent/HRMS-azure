
import { Request, Response } from 'express';
import pool from '../db';

export const getAllInterviews = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_interviews');
    res.json({ success: true, message: "Interviews fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getInterviewById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_interviews WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    res.json({ success: true, message: "Interview fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching interview by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createInterview = async (req: Request, res: Response) => {
  const { candidate_id, job_opening_id, interviewer_id, interview_date, feedback, status } = req.body;
  if (!candidate_id || !job_opening_id || !interviewer_id || !interview_date) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_interviews (candidate_id, job_opening_id, interviewer_id, interview_date, feedback, status) VALUES (?, ?, ?, ?, ?, ?)', [candidate_id, job_opening_id, interviewer_id, interview_date, feedback, status]);
    res.status(201).json({ success: true, message: 'Interview created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateInterview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { candidate_id, job_opening_id, interviewer_id, interview_date, feedback, status } = req.body;
  if (!candidate_id || !job_opening_id || !interviewer_id || !interview_date) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_interviews SET candidate_id = ?, job_opening_id = ?, interviewer_id = ?, interview_date = ?, feedback = ?, status = ? WHERE id = ?', [candidate_id, job_opening_id, interviewer_id, interview_date, feedback, status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    res.json({ success: true, message: 'Interview updated successfully' });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteInterview = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_interviews WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    res.json({ success: true, message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
