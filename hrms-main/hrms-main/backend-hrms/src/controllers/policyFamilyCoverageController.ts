
import { Request, Response } from 'express';
import pool from '../db';

export const getAllPolicyFamilyCoverages = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_policy_family_coverage');
    res.json({ success: true, message: "Policy Family Coverages fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching policy family coverages:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPolicyFamilyCoverageById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_policy_family_coverage WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Policy Family Coverage not found' });
    }
    res.json({ success: true, message: "Policy Family Coverage fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching policy family coverage by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createPolicyFamilyCoverage = async (req: Request, res: Response) => {
  const { policy_id, member_name, relationship, date_of_birth, coverage_amount } = req.body;
  if (!policy_id || !member_name || !relationship || !date_of_birth || !coverage_amount) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_policy_family_coverage (policy_id, member_name, relationship, date_of_birth, coverage_amount) VALUES (?, ?, ?, ?, ?)', [policy_id, member_name, relationship, date_of_birth, coverage_amount]);
    res.status(201).json({ success: true, message: 'Policy Family Coverage created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating policy family coverage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updatePolicyFamilyCoverage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { policy_id, member_name, relationship, date_of_birth, coverage_amount, is_active } = req.body;
  if (!policy_id || !member_name || !relationship || !date_of_birth || !coverage_amount) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_policy_family_coverage SET policy_id = ?, member_name = ?, relationship = ?, date_of_birth = ?, coverage_amount = ?, is_active = ? WHERE id = ?', [policy_id, member_name, relationship, date_of_birth, coverage_amount, is_active, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Policy Family Coverage not found' });
    }
    res.json({ success: true, message: 'Policy Family Coverage updated successfully' });
  } catch (error) {
    console.error('Error updating policy family coverage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deletePolicyFamilyCoverage = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_policy_family_coverage WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Policy Family Coverage not found' });
    }
    res.json({ success: true, message: 'Policy Family Coverage deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy family coverage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
