
import { Request, Response } from 'express';
import pool from '../db';

export const getAllCandidates = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_candidates');
    res.json({ success: true, message: "Candidates fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_candidates WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    res.json({ success: true, message: "Candidate fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching candidate by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createCandidate = async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, resume_path } = req.body;
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_candidates (first_name, last_name, email, phone, resume_path) VALUES (?, ?, ?, ?, ?)', [first_name, last_name, email, phone, resume_path]);
    res.status(201).json({ success: true, message: 'Candidate created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCandidate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, resume_path } = req.body;
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_candidates SET first_name = ?, last_name = ?, email = ?, phone = ?, resume_path = ? WHERE id = ?', [first_name, last_name, email, phone, resume_path, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    res.json({ success: true, message: 'Candidate updated successfully' });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteCandidate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_candidates WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
