
import { Request, Response } from 'express';
import pool from '../db';
import {
  convertRowsToCamelCase,
  convertRowToCamelCase,
  formatDateForMySQL,
  formatDateForDisplay
} from '../utils/dataConversion';

export const getAllInsurancePolicies = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, e.first_name, e.last_name, 
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_insurance_policies p
      JOIN hrms_employees e ON p.employee_id = e.id
    `);

    // For each policy, fetch beneficiaries and family coverage
    const policiesWithDetails = await Promise.all(rows.map(async (policy: any) => {
      const [beneficiaries]: any = await pool.query(
        'SELECT * FROM hrms_policy_beneficiaries WHERE policy_id = ?',
        [policy.id]
      );
      const [familyCoverage]: any = await pool.query(
        'SELECT * FROM hrms_policy_family_coverage WHERE policy_id = ?',
        [policy.id]
      );

      return {
        ...policy,
        beneficiaries: convertRowsToCamelCase(beneficiaries),
        familyCoverage: convertRowsToCamelCase(familyCoverage)
      };
    }));

    const camelCaseRows = convertRowsToCamelCase(policiesWithDetails);
    camelCaseRows.forEach((row: any) => {
      row.startDate = formatDateForDisplay(row.startDate);
      row.endDate = formatDateForDisplay(row.endDate);
      // Details were already camelCased in the map
    });

    res.json({ success: true, message: "Insurance Policies fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching insurance policies:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getInsurancePolicyById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, e.first_name, e.last_name,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_insurance_policies p
      JOIN hrms_employees e ON p.employee_id = e.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insurance Policy not found' });
    }

    const [beneficiaries]: any = await pool.query(
      'SELECT * FROM hrms_policy_beneficiaries WHERE policy_id = ?',
      [id]
    );
    const [familyCoverage]: any = await pool.query(
      'SELECT * FROM hrms_policy_family_coverage WHERE policy_id = ?',
      [id]
    );

    const policyData = {
      ...rows[0],
      beneficiaries: convertRowsToCamelCase(beneficiaries),
      familyCoverage: convertRowsToCamelCase(familyCoverage)
    };

    const camelCaseRow = convertRowToCamelCase(policyData);
    camelCaseRow.startDate = formatDateForDisplay(camelCaseRow.startDate);
    camelCaseRow.endDate = formatDateForDisplay(camelCaseRow.endDate);

    res.json({ success: true, message: "Insurance Policy fetched successfully", data: camelCaseRow });
  } catch (error) {
    console.error('Error fetching insurance policy by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createInsurancePolicy = async (req: Request, res: Response) => {
  const {
    employeeId, policyType, policyNumber, insuranceProvider, policyName,
    coverageAmount, premiumAmount, premiumFrequency, startDate, endDate,
    status, isCompanyProvided, employeeContribution, companyContribution,
    deductible, coPayment, remarks, beneficiaries, familyCoverage
  } = req.body;

  const requiredFields = {
    employeeId, policyType, policyNumber, insuranceProvider, policyName,
    coverageAmount, premiumAmount, premiumFrequency, startDate, endDate, status
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      `INSERT INTO hrms_insurance_policies (
        employee_id, policy_type, policy_number, insurance_provider, policy_name, 
        coverage_amount, premium_amount, premium_frequency, start_date, end_date, 
        status, is_company_provided, employee_contribution, company_contribution, 
        deductible, co_payment, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId, policyType, policyNumber, insuranceProvider, policyName,
        coverageAmount, premiumAmount, premiumFrequency,
        formatDateForMySQL(startDate),
        formatDateForMySQL(endDate),
        status, isCompanyProvided ? 1 : 0,
        employeeContribution || 0, companyContribution || 0,
        deductible || 0, coPayment || 0, remarks
      ]
    );
    const policyId = result.insertId;

    // Insert beneficiaries
    if (beneficiaries && Array.isArray(beneficiaries)) {
      for (const b of beneficiaries) {
        await connection.query(
          'INSERT INTO hrms_policy_beneficiaries (policy_id, name, relationship, percentage, contact_number, address) VALUES (?, ?, ?, ?, ?, ?)',
          [policyId, b.name, b.relationship, b.percentage, b.contactNumber, b.address]
        );
      }
    }

    // Insert family coverage
    if (familyCoverage && Array.isArray(familyCoverage)) {
      for (const fc of familyCoverage) {
        await connection.query(
          'INSERT INTO hrms_policy_family_coverage (policy_id, member_name, relationship, date_of_birth, coverage_amount, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [policyId, fc.memberName, fc.relationship, formatDateForMySQL(fc.dateOfBirth), fc.coverageAmount, fc.isActive ? 1 : 0]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Insurance Policy created successfully', id: policyId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating insurance policy:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const updateInsurancePolicy = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    employeeId, policyType, policyNumber, insuranceProvider, policyName,
    coverageAmount, premiumAmount, premiumFrequency, startDate, endDate,
    status, isCompanyProvided, employeeContribution, companyContribution,
    deductible, coPayment, remarks, beneficiaries, familyCoverage
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      `UPDATE hrms_insurance_policies SET 
        employee_id = ?, policy_type = ?, policy_number = ?, insurance_provider = ?, policy_name = ?, 
        coverage_amount = ?, premium_amount = ?, premium_frequency = ?, start_date = ?, end_date = ?, 
        status = ?, is_company_provided = ?, employee_contribution = ?, company_contribution = ?, 
        deductible = ?, co_payment = ?, remarks = ? 
      WHERE id = ?`,
      [
        employeeId, policyType, policyNumber, insuranceProvider, policyName,
        coverageAmount, premiumAmount, premiumFrequency,
        formatDateForMySQL(startDate),
        formatDateForMySQL(endDate),
        status, isCompanyProvided ? 1 : 0,
        employeeContribution, companyContribution,
        deductible, coPayment, remarks, id
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Insurance Policy not found' });
    }

    // Update beneficiaries: delete and re-insert
    await connection.query('DELETE FROM hrms_policy_beneficiaries WHERE policy_id = ?', [id]);
    if (beneficiaries && Array.isArray(beneficiaries)) {
      for (const b of beneficiaries) {
        await connection.query(
          'INSERT INTO hrms_policy_beneficiaries (policy_id, name, relationship, percentage, contact_number, address) VALUES (?, ?, ?, ?, ?, ?)',
          [id, b.name, b.relationship, b.percentage, b.contactNumber, b.address]
        );
      }
    }

    // Update family coverage: delete and re-insert
    await connection.query('DELETE FROM hrms_policy_family_coverage WHERE policy_id = ?', [id]);
    if (familyCoverage && Array.isArray(familyCoverage)) {
      for (const fc of familyCoverage) {
        await connection.query(
          'INSERT INTO hrms_policy_family_coverage (policy_id, member_name, relationship, date_of_birth, coverage_amount, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [id, fc.memberName, fc.relationship, formatDateForMySQL(fc.dateOfBirth), fc.coverageAmount, fc.isActive ? 1 : 0]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Insurance Policy updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating insurance policy:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const deleteInsurancePolicy = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_insurance_policies WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Insurance Policy not found' });
    }
    res.json({ success: true, message: 'Insurance Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting insurance policy:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
