import { Request, Response } from 'express';
import pool from '../db';
import pdfService from '../services/pdfService';

export const getAllLeaveRequests = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_leave_requests');
    res.json({ success: true, message: "Leave Requests fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLeaveRequestById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_leave_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave Request not found' });
    }
    res.json({ success: true, message: "Leave Request fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching leave request by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createLeaveRequest = async (req: Request, res: Response) => {
  const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;
  if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO hrms_leave_requests (employee_id, leave_type_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
      [employeeId, leaveTypeId, startDate, endDate, reason]
    );
    res.status(201).json({ success: true, message: 'Leave Request created successfully', id: result.insertId });
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    console.error('Request Body:', req.body);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: `Failed to save data. A foreign key constraint failed. Please check the values for employee_id or leave_type_id.`,
        error: error.sqlMessage
      });
    }

    res.status(500).json({ success: false, message: 'Failed to create leave request' });
  }
};

export const updateLeaveRequestStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  try {
    const [result]: any = await pool.query(
      'UPDATE hrms_leave_requests SET status = ?, approved_by = ?, approved_date = CURRENT_TIMESTAMP WHERE id = ?',
      [status, approved_by, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave Request not found' });
    }

    // Auto-generate PDF when approved
    if (status === 'APPROVED') {
      try {
        await pdfService.generateEmployeeFormPDF('LEAVE', parseInt(id));
        console.log(`PDF generated automatically for Leave Request ${id}`);
      } catch (pdfError) {
        console.error('Error auto-generating PDF:', pdfError);
        // Don't fail the request if PDF generation fails
      }
    }

    res.json({ success: true, message: 'Leave Request status updated successfully' });
  } catch (error) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave request status' });
  }
};