
import { Request, Response } from 'express';
import pool from '../db';
import {
  convertRowsToCamelCase,
  convertRowToCamelCase,
  formatDateForMySQL,
  formatDateForDisplay
} from '../utils/dataConversion';

export const getAllInsuranceClaims = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT ic.*, ip.policy_number, ip.policy_name, e.first_name, e.last_name,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_insurance_claims ic
      JOIN hrms_insurance_policies ip ON ic.policy_id = ip.id
      JOIN hrms_employees e ON ip.employee_id = e.id
    `);

    const camelCaseRows = convertRowsToCamelCase(rows);
    camelCaseRows.forEach((row: any) => {
      row.claimDate = formatDateForDisplay(row.claimDate);
      row.submittedDate = formatDateForDisplay(row.submittedDate);
      if (row.settlementDate) row.settlementDate = formatDateForDisplay(row.settlementDate);
    });

    res.json({ success: true, message: "Insurance Claims fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getInsuranceClaimById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(`
      SELECT ic.*, ip.policy_number, ip.policy_name, e.first_name, e.last_name,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_insurance_claims ic
      JOIN hrms_insurance_policies ip ON ic.policy_id = ip.id
      JOIN hrms_employees e ON ip.employee_id = e.id
      WHERE ic.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insurance Claim not found' });
    }

    const camelCaseRow = convertRowToCamelCase(rows[0]);
    camelCaseRow.claimDate = formatDateForDisplay(camelCaseRow.claimDate);
    camelCaseRow.submittedDate = formatDateForDisplay(camelCaseRow.submittedDate);
    if (camelCaseRow.settlementDate) camelCaseRow.settlementDate = formatDateForDisplay(camelCaseRow.settlementDate);

    res.json({ success: true, message: "Insurance Claim fetched successfully", data: camelCaseRow });
  } catch (error) {
    console.error('Error fetching insurance claim by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createInsuranceClaim = async (req: Request, res: Response) => {
  const {
    policyId, claimNumber, claimDate, claimAmount, approvedAmount,
    claimType, description, status, submittedDate, settlementDate, remarks
  } = req.body;

  const requiredFields = {
    policyId, claimNumber, claimDate, claimAmount, claimType, description, status, submittedDate
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Required fields are missing: ${missingFields.join(', ')}`
    });
  }

  try {
    const [result]: any = await pool.query(
      `INSERT INTO hrms_insurance_claims (
        policy_id, claim_number, claim_date, claim_amount, approved_amount, 
        claim_type, description, status, submitted_date, settlement_date, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policyId, claimNumber, formatDateForMySQL(claimDate),
        claimAmount, approvedAmount || 0,
        claimType, description, status,
        formatDateForMySQL(submittedDate),
        formatDateForMySQL(settlementDate), remarks
      ]
    );
    res.status(201).json({ success: true, message: 'Insurance Claim created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateInsuranceClaim = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    policyId, claimNumber, claimDate, claimAmount, approvedAmount,
    claimType, description, status, submittedDate, settlementDate, remarks
  } = req.body;

  try {
    const [result]: any = await pool.query(
      `UPDATE hrms_insurance_claims SET 
        policy_id = ?, claim_number = ?, claim_date = ?, claim_amount = ?, approved_amount = ?, 
        claim_type = ?, description = ?, status = ?, submitted_date = ?, settlement_date = ?, remarks = ? 
      WHERE id = ?`,
      [
        policyId, claimNumber, formatDateForMySQL(claimDate),
        claimAmount, approvedAmount,
        claimType, description, status,
        formatDateForMySQL(submittedDate),
        formatDateForMySQL(settlementDate), remarks, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Insurance Claim not found' });
    }
    res.json({ success: true, message: 'Insurance Claim updated successfully' });
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteInsuranceClaim = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_insurance_claims WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Insurance Claim not found' });
    }
    res.json({ success: true, message: 'Insurance Claim deleted successfully' });
  } catch (error) {
    console.error('Error deleting insurance claim:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
