import { Request, Response } from 'express';
import pool from '../db';
import pdfService from '../services/pdfService';

export const getAllExpenseRequests = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_expense_requests');
    res.json({ success: true, message: "Expense Requests fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching expense requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getExpenseRequestById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_expense_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense Request not found' });
    }
    res.json({ success: true, message: "Expense Request fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching expense request by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createExpenseRequest = async (req: Request, res: Response) => {
  const { employee_id, expense_category_id, amount, description } = req.body;
  if (!employee_id || !expense_category_id || !amount) {
    return res.status(400).json({ success: false, message: 'Employee, category, and amount are required' });
  }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO hrms_expense_requests (employee_id, expense_category_id, amount, description) VALUES (?, ?, ?, ?)',
      [employee_id, expense_category_id, amount, description]
    );
    res.status(201).json({ success: true, message: 'Expense Request created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating expense request:', error);
    res.status(500).json({ success: false, message: 'Failed to create expense request' });
  }
};

export const updateExpenseRequestStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  try {
    const [result]: any = await pool.query(
      'UPDATE hrms_expense_requests SET status = ?, approved_by = ? WHERE id = ?',
      [status, approved_by, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Expense Request not found' });
    }

    // Auto-generate PDF when approved
    if (status === 'APPROVED') {
      try {
        await pdfService.generateEmployeeFormPDF('EXPENSE', parseInt(id));
        console.log(`PDF generated automatically for Expense Request ${id}`);
      } catch (pdfError) {
        console.error('Error auto-generating PDF:', pdfError);
        // Don't fail the request if PDF generation fails
      }
    }

    res.json({ success: true, message: 'Expense Request status updated successfully' });
  } catch (error) {
    console.error('Error updating expense request status:', error);
    res.status(500).json({ success: false, message: 'Failed to update expense request status' });
  }
};