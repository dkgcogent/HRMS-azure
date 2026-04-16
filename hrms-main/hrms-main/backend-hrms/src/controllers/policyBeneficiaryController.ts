
import { Request, Response } from 'express';
import pool from '../db';

export const getAllPolicyBeneficiaries = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_policy_beneficiaries');
    res.json({ success: true, message: "Policy Beneficiaries fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching policy beneficiaries:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPolicyBeneficiaryById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_policy_beneficiaries WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Policy Beneficiary not found' });
    }
    res.json({ success: true, message: "Policy Beneficiary fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching policy beneficiary by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createPolicyBeneficiary = async (req: Request, res: Response) => {
  const { policy_id, name, relationship, percentage, contact_number, address } = req.body;
  if (!policy_id || !name || !relationship || !percentage) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_policy_beneficiaries (policy_id, name, relationship, percentage, contact_number, address) VALUES (?, ?, ?, ?, ?, ?)', [policy_id, name, relationship, percentage, contact_number, address]);
    res.status(201).json({ success: true, message: 'Policy Beneficiary created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating policy beneficiary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updatePolicyBeneficiary = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { policy_id, name, relationship, percentage, contact_number, address } = req.body;
  if (!policy_id || !name || !relationship || !percentage) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_policy_beneficiaries SET policy_id = ?, name = ?, relationship = ?, percentage = ?, contact_number = ?, address = ? WHERE id = ?', [policy_id, name, relationship, percentage, contact_number, address, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Policy Beneficiary not found' });
    }
    res.json({ success: true, message: 'Policy Beneficiary updated successfully' });
  } catch (error) {
    console.error('Error updating policy beneficiary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deletePolicyBeneficiary = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_policy_beneficiaries WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Policy Beneficiary not found' });
    }
    res.json({ success: true, message: 'Policy Beneficiary deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy beneficiary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
