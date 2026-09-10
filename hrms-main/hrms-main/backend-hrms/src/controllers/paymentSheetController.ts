import { Request, Response } from 'express';
import pool from '../db';

export const getPaymentSheets = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_payment_sheets ORDER BY start_date DESC, id DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching payment sheets:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getPaymentSheetById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_payment_sheets WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment sheet not found' });
    }
    const sheet = rows[0];
    if (sheet.sheet_data && typeof sheet.sheet_data === 'string') {
      try {
        sheet.sheet_data = JSON.parse(sheet.sheet_data);
      } catch (e) {
        // keep as is
      }
    }
    res.json({ success: true, data: sheet });
  } catch (error: any) {
    console.error('Error fetching payment sheet by id:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const createOrUpdatePaymentSheet = async (req: Request, res: Response) => {
  const { month_str, start_date, end_date, sheet_data, status, notes } = req.body;
  if (!month_str || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Month, start date, and end date are required' });
  }

  try {
    const sheetDataArray = Array.isArray(sheet_data) ? sheet_data : [];
    const totalEmployees = sheetDataArray.length;
    let totalGross = 0;
    let totalNet = 0;

    sheetDataArray.forEach((r: any) => {
      totalGross += parseFloat(r.grossSalary || r.gross_salary || 0);
      totalNet += parseFloat(r.netSalary || r.net_salary || 0);
    });

    const sheetDataStr = JSON.stringify(sheetDataArray);

    // Check if a payment sheet for the same month/range already exists
    const [existing]: any = await pool.query(
      'SELECT id, status FROM hrms_payment_sheets WHERE month_str = ? OR (start_date = ? AND end_date = ?)',
      [month_str, start_date, end_date]
    );

    if (existing.length > 0) {
      const existingSheet = existing[0];
      if (existingSheet.status === 'APPROVED') {
        return res.status(400).json({ success: false, message: 'Payment sheet is already approved and locked' });
      }

      await pool.query(
        `UPDATE hrms_payment_sheets 
         SET month_str = ?, start_date = ?, end_date = ?, total_employees = ?, total_gross = ?, total_net = ?, sheet_data = ?, notes = COALESCE(?, notes)
         WHERE id = ?`,
        [month_str, start_date, end_date, totalEmployees, totalGross, totalNet, sheetDataStr, notes || null, existingSheet.id]
      );

      return res.json({ success: true, message: 'Payment sheet updated successfully', id: existingSheet.id });
    }

    const [result]: any = await pool.query(
      `INSERT INTO hrms_payment_sheets (month_str, start_date, end_date, status, total_employees, total_gross, total_net, sheet_data, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [month_str, start_date, end_date, status || 'DRAFT', totalEmployees, totalGross, totalNet, sheetDataStr, notes || null]
    );

    res.status(201).json({ success: true, message: 'Payment sheet created successfully', id: result.insertId });
  } catch (error: any) {
    console.error('Error saving payment sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save payment sheet' });
  }
};

export const updatePaymentSheetById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sheet_data, notes } = req.body;

  try {
    const [existing]: any = await pool.query('SELECT * FROM hrms_payment_sheets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment sheet not found' });
    }

    if (existing[0].status === 'APPROVED' || existing[0].status === 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Payment sheet has been sent for approval and cannot be edited' });
    }

    const sheetDataArray = Array.isArray(sheet_data) ? sheet_data : [];
    let totalGross = 0;
    let totalNet = 0;

    sheetDataArray.forEach((r: any) => {
      totalGross += parseFloat(r.grossSalary || r.gross_salary || 0);
      totalNet += parseFloat(r.netSalary || r.net_salary || 0);
    });

    const sheetDataStr = JSON.stringify(sheetDataArray);

    await pool.query(
      `UPDATE hrms_payment_sheets 
       SET total_employees = ?, total_gross = ?, total_net = ?, sheet_data = ?, notes = COALESCE(?, notes)
       WHERE id = ?`,
      [sheetDataArray.length, totalGross, totalNet, sheetDataStr, notes || null, id]
    );

    res.json({ success: true, message: 'Payment sheet updated successfully' });
  } catch (error: any) {
    console.error('Error updating payment sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update payment sheet' });
  }
};

export const sendForApproval = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [existing]: any = await pool.query('SELECT * FROM hrms_payment_sheets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment sheet not found' });
    }

    if (existing[0].status === 'APPROVED' || existing[0].status === 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Payment sheet has already been submitted for approval' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    await pool.query(
      'UPDATE hrms_payment_sheets SET status = ?, sent_date = ? WHERE id = ?',
      ['PENDING_APPROVAL', todayStr, id]
    );

    res.json({ success: true, message: 'Payment sheet sent for approval successfully', sentDate: todayStr });
  } catch (error: any) {
    console.error('Error sending payment sheet for approval:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send for approval' });
  }
};

export const approvePaymentSheet = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [existing]: any = await pool.query('SELECT * FROM hrms_payment_sheets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment sheet not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    await pool.query(
      'UPDATE hrms_payment_sheets SET status = ?, approved_date = ? WHERE id = ?',
      ['APPROVED', todayStr, id]
    );

    res.json({ success: true, message: 'Payment sheet approved successfully', approvedDate: todayStr });
  } catch (error: any) {
    console.error('Error approving payment sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to approve payment sheet' });
  }
};

export const rejectPaymentSheet = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const [existing]: any = await pool.query('SELECT * FROM hrms_payment_sheets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment sheet not found' });
    }

    await pool.query(
      'UPDATE hrms_payment_sheets SET status = ?, notes = CONCAT(COALESCE(notes, ""), "\nRejection reason: ", ?) WHERE id = ?',
      ['REJECTED', reason || 'Rejected by approver', id]
    );

    res.json({ success: true, message: 'Payment sheet rejected' });
  } catch (error: any) {
    console.error('Error rejecting payment sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reject payment sheet' });
  }
};

export const deletePaymentSheet = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [existing]: any = await pool.query('SELECT status FROM hrms_payment_sheets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment sheet not found' });
    }
    if (existing[0].status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot delete an approved payment sheet' });
    }

    await pool.query('DELETE FROM hrms_payment_sheets WHERE id = ?', [id]);
    res.json({ success: true, message: 'Payment sheet deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting payment sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete payment sheet' });
  }
};
