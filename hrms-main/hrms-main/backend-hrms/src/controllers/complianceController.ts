import { Request, Response } from 'express';
import pool from '../db';

// ==================== ESI RECORDS ====================
export const getAllEsiRecords = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT e.*, 
        CONCAT(emp.first_name, ' ', emp.last_name) AS employee_name,
        emp.employee_id AS emp_code,
        d.name AS department_name,
        des.name AS designation_name
      FROM esi_records e
      LEFT JOIN hrms_employees emp ON e.employee_id = emp.id
      LEFT JOIN hrms_departments d ON emp.department_id = d.id
      LEFT JOIN hrms_designations des ON emp.designation_id = des.id
      ORDER BY e.created_at DESC
    `);
        res.json({ success: true, message: 'ESI records fetched', data: rows });
    } catch (error) {
        console.error('Error fetching ESI records:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createEsiRecord = async (req: Request, res: Response) => {
    const { employee_id, esi_number, month, year, gross_wages, esi_employee_contribution, esi_employer_contribution, payment_date, remarks } = req.body;
    if (!employee_id || !month || !year) {
        return res.status(400).json({ success: false, message: 'Employee, month, and year are required' });
    }
    try {
        const gross = parseFloat(gross_wages) || 0;
        const empContrib = parseFloat(esi_employee_contribution) || parseFloat((gross * 0.0075).toFixed(2));
        const erContrib = parseFloat(esi_employer_contribution) || parseFloat((gross * 0.0325).toFixed(2));
        const [result]: any = await pool.query(
            `INSERT INTO esi_records (employee_id, esi_number, month, year, gross_wages, esi_employee_contribution, esi_employer_contribution, total_contribution, payment_date, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [employee_id, esi_number || null, month, year, gross, empContrib, erContrib, empContrib + erContrib, payment_date || null, remarks || null]
        );
        res.status(201).json({ success: true, message: 'ESI record created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating ESI record:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateEsiRecord = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { employee_id, esi_number, month, year, gross_wages, esi_employee_contribution, esi_employer_contribution, payment_date, remarks, status } = req.body;
    try {
        const gross = parseFloat(gross_wages) || 0;
        const empContrib = parseFloat(esi_employee_contribution) || parseFloat((gross * 0.0075).toFixed(2));
        const erContrib = parseFloat(esi_employer_contribution) || parseFloat((gross * 0.0325).toFixed(2));
        const [result]: any = await pool.query(
            `UPDATE esi_records SET employee_id=?, esi_number=?, month=?, year=?, gross_wages=?, esi_employee_contribution=?, esi_employer_contribution=?, total_contribution=?, payment_date=?, remarks=?, status=? WHERE id=?`,
            [employee_id, esi_number || null, month, year, gross, empContrib, erContrib, empContrib + erContrib, payment_date || null, remarks || null, status || 'PENDING', id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ESI record not found' });
        res.json({ success: true, message: 'ESI record updated successfully' });
    } catch (error) {
        console.error('Error updating ESI record:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteEsiRecord = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.query('DELETE FROM esi_records WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Record not found' });
        res.json({ success: true, message: 'ESI record deleted successfully' });
    } catch (error) {
        console.error('Error deleting ESI record:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==================== PF RECORDS ====================
export const getAllPfRecords = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT p.*, 
        CONCAT(emp.first_name, ' ', emp.last_name) AS employee_name,
        emp.employee_id AS emp_code,
        d.name AS department_name
      FROM pf_records p
      LEFT JOIN hrms_employees emp ON p.employee_id = emp.id
      LEFT JOIN hrms_departments d ON emp.department_id = d.id
      ORDER BY p.created_at DESC
    `);
        res.json({ success: true, message: 'PF records fetched', data: rows });
    } catch (error) {
        console.error('Error fetching PF records:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createPfRecord = async (req: Request, res: Response) => {
    const { employee_id, uan_number, pf_account_number, month, year, basic_salary, pf_employee_contribution, pf_employer_contribution, eps_contribution, payment_date, remarks } = req.body;
    if (!employee_id || !month || !year) {
        return res.status(400).json({ success: false, message: 'Employee, month, and year are required' });
    }
    try {
        const basic = parseFloat(basic_salary) || 0;
        const empContrib = parseFloat(pf_employee_contribution) || parseFloat((basic * 0.12).toFixed(2));
        const erContrib = parseFloat(pf_employer_contribution) || parseFloat((basic * 0.12).toFixed(2));
        const eps = parseFloat(eps_contribution) || parseFloat((Math.min(basic, 15000) * 0.0833).toFixed(2));
        const [result]: any = await pool.query(
            `INSERT INTO pf_records (employee_id, uan_number, pf_account_number, month, year, basic_salary, pf_employee_contribution, pf_employer_contribution, eps_contribution, total_contribution, payment_date, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [employee_id, uan_number || null, pf_account_number || null, month, year, basic, empContrib, erContrib, eps, empContrib + erContrib, payment_date || null, remarks || null]
        );
        res.status(201).json({ success: true, message: 'PF record created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating PF record:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updatePfRecord = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { employee_id, uan_number, pf_account_number, month, year, basic_salary, pf_employee_contribution, pf_employer_contribution, eps_contribution, payment_date, remarks, status } = req.body;
    try {
        const basic = parseFloat(basic_salary) || 0;
        const empContrib = parseFloat(pf_employee_contribution) || parseFloat((basic * 0.12).toFixed(2));
        const erContrib = parseFloat(pf_employer_contribution) || parseFloat((basic * 0.12).toFixed(2));
        const eps = parseFloat(eps_contribution) || parseFloat((Math.min(basic, 15000) * 0.0833).toFixed(2));
        const [result]: any = await pool.query(
            `UPDATE pf_records SET employee_id=?, uan_number=?, pf_account_number=?, month=?, year=?, basic_salary=?, pf_employee_contribution=?, pf_employer_contribution=?, eps_contribution=?, total_contribution=?, payment_date=?, remarks=?, status=? WHERE id=?`,
            [employee_id, uan_number || null, pf_account_number || null, month, year, basic, empContrib, erContrib, eps, empContrib + erContrib, payment_date || null, remarks || null, status || 'PENDING', id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'PF record not found' });
        res.json({ success: true, message: 'PF record updated successfully' });
    } catch (error) {
        console.error('Error updating PF record:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deletePfRecord = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.query('DELETE FROM pf_records WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Record not found' });
        res.json({ success: true, message: 'PF record deleted successfully' });
    } catch (error) {
        console.error('Error deleting PF record:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==================== COMPLIANCE SUMMARY ====================
export const getComplianceSummary = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        let esiQuery = 'SELECT COUNT(*) as total, SUM(total_contribution) as esi_total FROM esi_records';
        let pfQuery = 'SELECT COUNT(*) as total, SUM(total_contribution) as pf_total FROM pf_records';
        const params: any[] = [];
        if (month && year) {
            esiQuery += ' WHERE month = ? AND year = ?';
            pfQuery += ' WHERE month = ? AND year = ?';
            params.push(month, year);
        }
        const [[esiSum]]: any = await pool.query(esiQuery, params);
        const [[pfSum]]: any = await pool.query(pfQuery, params);
        res.json({
            success: true, data: {
                esi: { count: esiSum.total || 0, total: esiSum.esi_total || 0 },
                pf: { count: pfSum.total || 0, total: pfSum.pf_total || 0 }
            }
        });
    } catch (error) {
        console.error('Error fetching compliance summary:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Bulk sync - auto create ESI/PF records for all active employees for a given month/year
export const syncComplianceRecords = async (req: Request, res: Response) => {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year are required' });
    try {
        const [employees]: any = await pool.query(`
      SELECT e.id,
        COALESCE((SELECT monthly_ctc FROM hrms_offer_letters WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 0) AS gross_wages,
        COALESCE((SELECT monthly_ctc FROM hrms_offer_letters WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 0) AS basic_salary
      FROM hrms_employees e WHERE e.is_active = 1
    `);
        let esiCreated = 0, pfCreated = 0;
        for (const emp of employees) {
            const gross = parseFloat(emp.gross_wages) || 0;
            const basic = parseFloat(emp.basic_salary) || 0;
            // Check if ESI record exists
            const [esiExists]: any = await pool.query('SELECT id FROM esi_records WHERE employee_id=? AND month=? AND year=?', [emp.id, month, year]);
            if (esiExists.length === 0 && gross <= 21000) {
                await pool.query(
                    `INSERT INTO esi_records (employee_id, month, year, gross_wages, esi_employee_contribution, esi_employer_contribution, total_contribution, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
                    [emp.id, month, year, gross, (gross * 0.0075).toFixed(2), (gross * 0.0325).toFixed(2), (gross * 0.04).toFixed(2)]
                );
                esiCreated++;
            }
            // Check if PF record exists
            const [pfExists]: any = await pool.query('SELECT id FROM pf_records WHERE employee_id=? AND month=? AND year=?', [emp.id, month, year]);
            if (pfExists.length === 0) {
                await pool.query(
                    `INSERT INTO pf_records (employee_id, month, year, basic_salary, pf_employee_contribution, pf_employer_contribution, eps_contribution, total_contribution, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
                    [emp.id, month, year, basic, (basic * 0.12).toFixed(2), (basic * 0.12).toFixed(2), (Math.min(basic, 15000) * 0.0833).toFixed(2), (basic * 0.24).toFixed(2)]
                );
                pfCreated++;
            }
        }
        res.json({ success: true, message: `Sync complete. ESI: ${esiCreated} created, PF: ${pfCreated} created.`, data: { esiCreated, pfCreated } });
    } catch (error) {
        console.error('Error syncing compliance records:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
