
import { Request, Response } from 'express';
import pool from '../db';
import {
    convertRowsToCamelCase,
    convertRowToCamelCase,
    formatDateForMySQL,
    formatDateForDisplay
} from '../utils/dataConversion';

export const getAllPromotions = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT p.*, e.first_name, e.last_name, 
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_promotions p
      JOIN hrms_employees e ON p.employee_id = e.id
      ORDER BY p.effective_date DESC
    `);

        const camelCaseRows = convertRowsToCamelCase(rows);
        camelCaseRows.forEach((row: any) => {
            row.promotionDate = formatDateForDisplay(row.promotionDate);
            row.effectiveDate = formatDateForDisplay(row.effectiveDate);
            if (row.approvalDate) row.approvalDate = formatDateForDisplay(row.approvalDate);
            if (row.achievements && typeof row.achievements === 'string') {
                try {
                    row.achievements = JSON.parse(row.achievements);
                } catch (e) {
                    row.achievements = [];
                }
            }
        });

        res.json({ success: true, message: "Promotions fetched successfully", data: camelCaseRows });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getPromotionById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows]: any = await pool.query(`
      SELECT p.*, e.first_name, e.last_name,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_promotions p
      JOIN hrms_employees e ON p.employee_id = e.id
      WHERE p.id = ?
    `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        const camelCaseRow = convertRowToCamelCase(rows[0]);
        camelCaseRow.promotionDate = formatDateForDisplay(camelCaseRow.promotionDate);
        camelCaseRow.effectiveDate = formatDateForDisplay(camelCaseRow.effectiveDate);
        if (camelCaseRow.approvalDate) camelCaseRow.approvalDate = formatDateForDisplay(camelCaseRow.approvalDate);
        if (camelCaseRow.achievements && typeof camelCaseRow.achievements === 'string') {
            try {
                camelCaseRow.achievements = JSON.parse(camelCaseRow.achievements);
            } catch (e) {
                camelCaseRow.achievements = [];
            }
        }

        res.json({ success: true, message: "Promotion fetched successfully", data: camelCaseRow });
    } catch (error) {
        console.error('Error fetching promotion by ID:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getPromotionsByEmployeeId = async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    try {
        const [rows]: any = await pool.query(`
      SELECT p.*, e.first_name, e.last_name,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM hrms_promotions p
      JOIN hrms_employees e ON p.employee_id = e.id
      WHERE p.employee_id = ?
      ORDER BY p.effective_date DESC
    `, [employeeId]);

        const camelCaseRows = convertRowsToCamelCase(rows);
        camelCaseRows.forEach((row: any) => {
            row.promotionDate = formatDateForDisplay(row.promotionDate);
            row.effectiveDate = formatDateForDisplay(row.effectiveDate);
            if (row.approvalDate) row.approvalDate = formatDateForDisplay(row.approvalDate);
            if (row.achievements && typeof row.achievements === 'string') {
                try {
                    row.achievements = JSON.parse(row.achievements);
                } catch (e) {
                    row.achievements = [];
                }
            }
        });

        res.json({ success: true, message: "Employee promotions fetched successfully", data: camelCaseRows });
    } catch (error) {
        console.error('Error fetching promotions by employee ID:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createPromotion = async (req: Request, res: Response) => {
    const {
        employeeId, fromDesignation, toDesignation, fromDepartment, toDepartment,
        fromSalary, toSalary, promotionDate, effectiveDate, promotionType,
        reason, approvedBy, approvalDate, status, justification,
        performanceRating, achievements, newResponsibilities, trainingRequired, remarks
    } = req.body;

    if (!employeeId || !toDesignation || !effectiveDate || !promotionType) {
        return res.status(400).json({ success: false, message: 'Required fields are missing' });
    }

    try {
        const [result]: any = await pool.query(
            `INSERT INTO hrms_promotions (
        employee_id, from_designation, to_designation, from_department, to_department, 
        from_salary, to_salary, promotion_date, effective_date, promotion_type, 
        reason, approved_by, approval_date, status, justification, 
        performance_rating, achievements, new_responsibilities, training_required, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employeeId, fromDesignation, toDesignation, fromDepartment, toDepartment,
                fromSalary || 0, toSalary || 0,
                formatDateForMySQL(promotionDate),
                formatDateForMySQL(effectiveDate),
                promotionType,
                reason, approvedBy,
                formatDateForMySQL(approvalDate),
                status || 'DRAFT', justification,
                performanceRating, JSON.stringify(achievements || []), newResponsibilities, trainingRequired, remarks
            ]
        );

        // ── Update employee's current designation & department ──────────────────
        // Look up the new designation ID by name
        const newDesignationName = toDesignation;
        const newDepartmentName = toDepartment || fromDepartment;

        const [desRows]: any = await pool.query(
            'SELECT id FROM hrms_designations WHERE name = ? LIMIT 1', [newDesignationName]
        );
        const [deptRows]: any = await pool.query(
            'SELECT id FROM hrms_departments WHERE name = ? LIMIT 1', [newDepartmentName]
        );

        const updateFields: string[] = [];
        const updateValues: any[] = [];

        if (desRows && desRows.length > 0) {
            updateFields.push('designation_id = ?');
            updateValues.push(desRows[0].id);
        }
        if (deptRows && deptRows.length > 0) {
            updateFields.push('department_id = ?');
            updateValues.push(deptRows[0].id);
        }

        if (updateFields.length > 0) {
            updateValues.push(employeeId);
            await pool.query(
                `UPDATE hrms_employees SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
            console.log(`Employee ${employeeId} designation/department updated after promotion.`);
        }
        // ───────────────────────────────────────────────────────────────────────

        res.status(201).json({ success: true, message: 'Promotion created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updatePromotion = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        employeeId, fromDesignation, toDesignation, fromDepartment, toDepartment,
        fromSalary, toSalary, promotionDate, effectiveDate, promotionType,
        reason, approvedBy, approvalDate, status, justification,
        performanceRating, achievements, newResponsibilities, trainingRequired, remarks
    } = req.body;

    try {
        const [result]: any = await pool.query(
            `UPDATE hrms_promotions SET 
        employee_id = ?, from_designation = ?, to_designation = ?, from_department = ?, to_department = ?, 
        from_salary = ?, to_salary = ?, promotion_date = ?, effective_date = ?, promotion_type = ?, 
        reason = ?, approved_by = ?, approval_date = ?, status = ?, justification = ?, 
        performance_rating = ?, achievements = ?, new_responsibilities = ?, training_required = ?, remarks = ? 
      WHERE id = ?`,
            [
                employeeId, fromDesignation, toDesignation, fromDepartment, toDepartment,
                fromSalary, toSalary,
                formatDateForMySQL(promotionDate),
                formatDateForMySQL(effectiveDate),
                promotionType,
                reason, approvedBy,
                formatDateForMySQL(approvalDate),
                status, justification,
                performanceRating, JSON.stringify(achievements || []), newResponsibilities, trainingRequired, remarks, id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        // ── If status is APPROVED or IMPLEMENTED, sync employee profile ─────────
        if (status === 'APPROVED' || status === 'IMPLEMENTED') {
            const newDesignationName = toDesignation;
            const newDepartmentName = toDepartment || fromDepartment;

            const [desRows]: any = await pool.query(
                'SELECT id FROM hrms_designations WHERE name = ? LIMIT 1', [newDesignationName]
            );
            const [deptRows]: any = await pool.query(
                'SELECT id FROM hrms_departments WHERE name = ? LIMIT 1', [newDepartmentName]
            );

            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (desRows && desRows.length > 0) {
                updateFields.push('designation_id = ?');
                updateValues.push(desRows[0].id);
            }
            if (deptRows && deptRows.length > 0) {
                updateFields.push('department_id = ?');
                updateValues.push(deptRows[0].id);
            }

            if (updateFields.length > 0 && employeeId) {
                updateValues.push(employeeId);
                await pool.query(
                    `UPDATE hrms_employees SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
                console.log(`Employee ${employeeId} designation/department synced on promotion status: ${status}.`);
            }
        }
        // ───────────────────────────────────────────────────────────────────────

        res.json({ success: true, message: 'Promotion updated successfully' });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deletePromotion = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.query('DELETE FROM hrms_promotions WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
