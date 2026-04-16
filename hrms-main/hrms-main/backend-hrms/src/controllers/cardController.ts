import { Request, Response } from 'express';
import pool from '../db';

// ==================== ID CARDS ====================
export const getAllIdCards = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT ic.*, 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_id AS emp_code,
        e.mobile AS employee_mobile,
        e.work_email,
        e.photo_path,
        d.name AS department_name,
        des.name AS designation_name,
        wl.name AS work_location_name
      FROM id_cards ic
      LEFT JOIN hrms_employees e ON ic.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      LEFT JOIN hrms_work_locations wl ON e.work_location_id = wl.id
      ORDER BY ic.created_at DESC
    `);
        res.json({ success: true, message: 'ID cards fetched', data: rows });
    } catch (error) {
        console.error('Error fetching ID cards:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getIdCardByEmployee = async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    try {
        const [rows]: any = await pool.query(`
      SELECT ic.*, 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_id AS emp_code,
        e.mobile AS employee_mobile,
        e.work_email,
        e.photo_path,
        d.name AS department_name,
        des.name AS designation_name,
        wl.name AS work_location_name
      FROM id_cards ic
      LEFT JOIN hrms_employees e ON ic.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      LEFT JOIN hrms_work_locations wl ON e.work_location_id = wl.id
      WHERE ic.employee_id = ?
    `, [employeeId]);
        res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error('Error fetching ID card:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createOrUpdateIdCard = async (req: Request, res: Response) => {
    const { employee_id, card_type, issue_date, expiry_date, blood_group, emergency_contact, emergency_phone, address, qr_code_data, barcode_data, remarks } = req.body;
    if (!employee_id) {
        return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }
    try {
        // Generate card number
        const card_number = `ID${new Date().getFullYear()}${String(employee_id).padStart(4, '0')}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const [existing]: any = await pool.query('SELECT id FROM id_cards WHERE employee_id = ? AND card_type = ?', [employee_id, card_type || 'ID_CARD']);
        if (existing.length > 0) {
            await pool.query(
                `UPDATE id_cards SET issue_date=?, expiry_date=?, blood_group=?, emergency_contact=?, emergency_phone=?, address=?, qr_code_data=?, barcode_data=?, remarks=?, status='ACTIVE', updated_at=NOW() WHERE employee_id=? AND card_type=?`,
                [issue_date || null, expiry_date || null, blood_group || null, emergency_contact || null, emergency_phone || null, address || null, qr_code_data || null, barcode_data || null, remarks || null, employee_id, card_type || 'ID_CARD']
            );
            res.json({ success: true, message: 'ID card updated successfully' });
        } else {
            const [result]: any = await pool.query(
                `INSERT INTO id_cards (employee_id, card_number, card_type, issue_date, expiry_date, blood_group, emergency_contact, emergency_phone, address, qr_code_data, barcode_data, remarks, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                [employee_id, card_number, card_type || 'ID_CARD', issue_date || null, expiry_date || null, blood_group || null, emergency_contact || null, emergency_phone || null, address || null, qr_code_data || null, barcode_data || null, remarks || null]
            );
            res.status(201).json({ success: true, message: 'ID card created successfully', id: result.insertId, card_number });
        }
    } catch (error) {
        console.error('Error creating/updating ID card:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateIdCardStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, remarks } = req.body;
    try {
        const [result]: any = await pool.query('UPDATE id_cards SET status=?, remarks=? WHERE id=?', [status, remarks, id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ID card not found' });
        res.json({ success: true, message: 'ID card status updated' });
    } catch (error) {
        console.error('Error updating ID card:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteIdCard = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.query('DELETE FROM id_cards WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ID card not found' });
        res.json({ success: true, message: 'ID card deleted successfully' });
    } catch (error) {
        console.error('Error deleting ID card:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==================== VISITING CARDS ====================
export const getAllVisitingCards = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT vc.*, 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_id AS emp_code,
        d.name AS department_name
      FROM visiting_cards vc
      LEFT JOIN hrms_employees e ON vc.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      ORDER BY vc.created_at DESC
    `);
        res.json({ success: true, message: 'Visiting cards fetched', data: rows });
    } catch (error) {
        console.error('Error fetching visiting cards:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createVisitingCard = async (req: Request, res: Response) => {
    const { employee_id, display_name, display_designation, display_department, company_name, company_logo, mobile_on_card, email_on_card, office_phone, website, linkedin_url, address_on_card, quantity_requested, card_template, remarks } = req.body;
    if (!employee_id) {
        return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }
    try {
        const [result]: any = await pool.query(
            `INSERT INTO visiting_cards (employee_id, display_name, display_designation, display_department, company_name, company_logo, mobile_on_card, email_on_card, office_phone, website, linkedin_url, address_on_card, quantity_requested, card_template, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED')`,
            [employee_id, display_name || null, display_designation || null, display_department || null, company_name || null, company_logo || null, mobile_on_card || null, email_on_card || null, office_phone || null, website || null, linkedin_url || null, address_on_card || null, quantity_requested || 100, card_template || 'STANDARD', remarks || null]
        );
        res.status(201).json({ success: true, message: 'Visiting card request created', id: result.insertId });
    } catch (error) {
        console.error('Error creating visiting card:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateVisitingCard = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { display_name, display_designation, display_department, company_name, mobile_on_card, email_on_card, office_phone, website, linkedin_url, address_on_card, quantity_requested, quantity_printed, card_template, remarks, status } = req.body;
    try {
        const [result]: any = await pool.query(
            `UPDATE visiting_cards SET display_name=?, display_designation=?, display_department=?, company_name=?, mobile_on_card=?, email_on_card=?, office_phone=?, website=?, linkedin_url=?, address_on_card=?, quantity_requested=?, quantity_printed=?, card_template=?, remarks=?, status=? WHERE id=?`,
            [display_name || null, display_designation || null, display_department || null, company_name || null, mobile_on_card || null, email_on_card || null, office_phone || null, website || null, linkedin_url || null, address_on_card || null, quantity_requested || 100, quantity_printed || 0, card_template || 'STANDARD', remarks || null, status || 'REQUESTED', id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Visiting card not found' });
        res.json({ success: true, message: 'Visiting card updated successfully' });
    } catch (error) {
        console.error('Error updating visiting card:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteVisitingCard = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.query('DELETE FROM visiting_cards WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Visiting card not found' });
        res.json({ success: true, message: 'Visiting card deleted successfully' });
    } catch (error) {
        console.error('Error deleting visiting card:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
