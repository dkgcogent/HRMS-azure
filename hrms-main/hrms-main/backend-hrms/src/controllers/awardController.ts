import { Request, Response } from 'express';
import pool from '../db';

// ==================== AWARDS ====================
export const getAllAwards = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT a.*, 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_id AS emp_code,
        d.name AS department_name,
        des.name AS designation_name
      FROM hrms_awards a
      LEFT JOIN hrms_employees e ON a.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      ORDER BY a.created_at DESC
    `);
        res.json({ success: true, message: 'Awards fetched successfully', data: rows });
    } catch (error) {
        console.error('Error fetching awards:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getAwardById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows]: any = await pool.query(`
      SELECT a.*, 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        d.name AS department_name
      FROM hrms_awards a
      LEFT JOIN hrms_employees e ON a.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      WHERE a.id = ?
    `, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Award not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching award:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createAward = async (req: Request, res: Response) => {
    const { employee_id, award_name, award_type, category, description, award_date, given_by, certificate_number, remarks } = req.body;
    if (!employee_id || !award_name || !award_date) {
        return res.status(400).json({ success: false, message: 'Employee, award name, and date are required' });
    }
    try {
        const [result]: any = await pool.query(
            `INSERT INTO hrms_awards (employee_id, award_name, award_type, category, description, award_date, given_by, certificate_number, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [employee_id, award_name, award_type || 'RECOGNITION', category || 'PERFORMANCE', description || null, award_date || null, given_by || null, certificate_number || null, remarks || null]
        );
        res.status(201).json({ success: true, message: 'Award created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating award:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateAward = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { employee_id, award_name, award_type, category, description, award_date, given_by, certificate_number, remarks, status } = req.body;
    try {
        const [result]: any = await pool.query(
            `UPDATE hrms_awards SET employee_id=?, award_name=?, award_type=?, category=?, description=?, award_date=?, given_by=?, certificate_number=?, remarks=?, status=? WHERE id=?`,
            [employee_id, award_name, award_type || 'RECOGNITION', category || 'PERFORMANCE', description || null, award_date || null, given_by || null, certificate_number || null, remarks || null, status || 'ACTIVE', id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Award not found' });
        res.json({ success: true, message: 'Award updated successfully' });
    } catch (error) {
        console.error('Error updating award:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteAward = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.query('DELETE FROM hrms_awards WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Award not found' });
        res.json({ success: true, message: 'Award deleted successfully' });
    } catch (error) {
        console.error('Error deleting award:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==================== CERTIFICATIONS ====================
export const getAllCertifications = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT c.*, 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_id AS emp_code,
        d.name AS department_name,
        des.name AS designation_name
      FROM certifications c
      LEFT JOIN hrms_employees e ON c.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      ORDER BY c.created_at DESC
    `);
        res.json({ success: true, message: 'Certifications fetched successfully', data: rows });
    } catch (error) {
        console.error('Error fetching certifications:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createCertification = async (req: Request, res: Response) => {
    const { employee_id, certification_name, issuing_organization, certification_number, issue_date, expiry_date, skill_area, description, is_mandatory } = req.body;
    if (!employee_id || !certification_name || !issuing_organization) {
        return res.status(400).json({ success: false, message: 'Employee, certification name, and issuing organization are required' });
    }
    try {
        const [result]: any = await pool.query(
            `INSERT INTO certifications (employee_id, certification_name, issuing_organization, certification_number, issue_date, expiry_date, skill_area, description, is_mandatory, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [employee_id, certification_name, issuing_organization, certification_number || null, issue_date || null, expiry_date || null, skill_area || null, description || null, is_mandatory ? 1 : 0]
        );
        res.status(201).json({ success: true, message: 'Certification created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating certification:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateCertification = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { employee_id, certification_name, issuing_organization, certification_number, issue_date, expiry_date, skill_area, description, is_mandatory, status } = req.body;
    try {
        const [result]: any = await pool.query(
            `UPDATE certifications SET employee_id=?, certification_name=?, issuing_organization=?, certification_number=?, issue_date=?, expiry_date=?, skill_area=?, description=?, is_mandatory=?, status=? WHERE id=?`,
            [employee_id, certification_name, issuing_organization, certification_number || null, issue_date || null, expiry_date || null, skill_area || null, description || null, is_mandatory ? 1 : 0, status || 'ACTIVE', id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Certification not found' });
        res.json({ success: true, message: 'Certification updated successfully' });
    } catch (error) {
        console.error('Error updating certification:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteCertification = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.query('DELETE FROM certifications WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Certification not found' });
        res.json({ success: true, message: 'Certification deleted successfully' });
    } catch (error) {
        console.error('Error deleting certification:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
