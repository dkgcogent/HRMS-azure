
import { Request, Response } from 'express';
import pool from '../db';
import {
  convertRowsToCamelCase,
  convertRowToCamelCase,
  formatDateForMySQL,
  formatDateForDisplay
} from '../utils/dataConversion';

export const getAllGratuityRecords = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT g.*, e.first_name, e.last_name,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_gratuity_records g
      JOIN hrms_employees e ON g.employee_id = e.id
    `);

    const camelCaseRows = convertRowsToCamelCase(rows);
    camelCaseRows.forEach((row: any) => {
      row.joiningDate = formatDateForDisplay(row.joiningDate);
      row.lastCalculationDate = formatDateForDisplay(row.lastCalculationDate);
      if (row.paymentDate) row.paymentDate = formatDateForDisplay(row.paymentDate);
    });

    res.json({ success: true, message: "Gratuity Records fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching gratuity records:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getGratuityRecordById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(`
      SELECT g.*, e.first_name, e.last_name,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_gratuity_records g
      JOIN hrms_employees e ON g.employee_id = e.id
      WHERE g.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gratuity Record not found' });
    }

    const camelCaseRow = convertRowToCamelCase(rows[0]);
    camelCaseRow.joiningDate = formatDateForDisplay(camelCaseRow.joiningDate);
    camelCaseRow.lastCalculationDate = formatDateForDisplay(camelCaseRow.lastCalculationDate);
    if (camelCaseRow.paymentDate) camelCaseRow.paymentDate = formatDateForDisplay(camelCaseRow.paymentDate);

    res.json({ success: true, message: "Gratuity Record fetched successfully", data: camelCaseRow });
  } catch (error) {
    console.error('Error fetching gratuity record by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createGratuityRecord = async (req: Request, res: Response) => {
  const {
    employeeId, joiningDate, currentSalary, serviceYears, eligibleAmount,
    calculationMethod, lastCalculationDate, status, paymentDate, actualAmount
  } = req.body;

  if (!employeeId || !joiningDate || !currentSalary || !serviceYears || !eligibleAmount || !calculationMethod || !lastCalculationDate || !status) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }

  try {
    const [result]: any = await pool.query(
      `INSERT INTO hrms_gratuity_records (
        employee_id, joining_date, current_salary, service_years, eligible_amount, 
        calculation_method, last_calculation_date, status, payment_date, actual_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId, formatDateForMySQL(joiningDate), currentSalary, serviceYears,
        eligibleAmount, calculationMethod, formatDateForMySQL(lastCalculationDate),
        status, formatDateForMySQL(paymentDate), actualAmount || 0
      ]
    );
    res.status(201).json({ success: true, message: 'Gratuity Record created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating gratuity record:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateGratuityRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    employeeId, joiningDate, currentSalary, serviceYears, eligibleAmount,
    calculationMethod, lastCalculationDate, status, paymentDate, actualAmount
  } = req.body;

  try {
    const [result]: any = await pool.query(
      `UPDATE hrms_gratuity_records SET 
        employee_id = ?, joining_date = ?, current_salary = ?, service_years = ?, eligible_amount = ?, 
        calculation_method = ?, last_calculation_date = ?, status = ?, payment_date = ?, actual_amount = ? 
      WHERE id = ?`,
      [
        employeeId, formatDateForMySQL(joiningDate), currentSalary, serviceYears,
        eligibleAmount, calculationMethod, formatDateForMySQL(lastCalculationDate),
        status, formatDateForMySQL(paymentDate), actualAmount, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Gratuity Record not found' });
    }
    res.json({ success: true, message: 'Gratuity Record updated successfully' });
  } catch (error) {
    console.error('Error updating gratuity record:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteGratuityRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_gratuity_records WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Gratuity Record not found' });
    }
    res.json({ success: true, message: 'Gratuity Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting gratuity record:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const syncGratuityRecords = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all active employees with their joining date and latest salary from hrms_offer_letters
    const [employees]: any = await pool.query(`
      SELECT 
        e.id, 
        e.joining_date,
        CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name,
        (SELECT monthly_ctc FROM hrms_offer_letters WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1) as monthly_salary
      FROM hrms_employees e
      WHERE e.status = 'ACTIVE'
    `);

    const now = new Date();
    let updatedCount = 0;
    let insertedCount = 0;

    for (const employee of employees) {
      if (!employee.joining_date) continue;

      const joiningDate = new Date(employee.joining_date);
      const monthlySalary = employee.monthly_salary || 0;

      // Calculate service years (approximate)
      const diffTime = Math.abs(now.getTime() - joiningDate.getTime());
      const serviceYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));

      // Eligibility check (minimum 5 years)
      const isEligible = serviceYears >= 5;
      const status = isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE';

      // Gratuity calculation: (15 days salary × years of service) ÷ 26
      // Monthly Salary = 26 working days
      // 15 days salary = (monthlySalary / 26) * 15
      let eligibleAmount = 0;
      if (isEligible) {
        eligibleAmount = Math.min(((monthlySalary / 26) * 15) * serviceYears, 2000000);
      }

      // Check if record exists
      const [existing]: any = await pool.query('SELECT id FROM hrms_gratuity_records WHERE employee_id = ?', [employee.id]);

      if (existing.length > 0) {
        // Update
        await pool.query(
          `UPDATE hrms_gratuity_records SET 
            joining_date = ?, current_salary = ?, service_years = ?, 
            eligible_amount = ?, last_calculation_date = ?, status = ?
          WHERE employee_id = ?`,
          [
            formatDateForMySQL(employee.joining_date), monthlySalary, serviceYears,
            eligibleAmount, formatDateForMySQL(now.toISOString()), status,
            employee.id
          ]
        );
        updatedCount++;
      } else {
        // Insert
        await pool.query(
          `INSERT INTO hrms_gratuity_records (
            employee_id, joining_date, current_salary, service_years, 
            eligible_amount, calculation_method, last_calculation_date, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employee.id, formatDateForMySQL(employee.joining_date), monthlySalary, serviceYears,
            eligibleAmount, 'Standard (15 days/26)', formatDateForMySQL(now.toISOString()), status
          ]
        );
        insertedCount++;
      }
    }

    res.json({
      success: true,
      message: `Gratuity records synced successfully. ${insertedCount} new records created, ${updatedCount} records updated.`
    });
  } catch (error) {
    console.error('Error syncing gratuity records:', error);
    res.status(500).json({ success: false, message: 'Internal server error while syncing gratuity' });
  }
};
