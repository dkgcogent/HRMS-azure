import { Request, Response } from 'express';
import pool from '../db';
import pdfService from '../services/pdfService';
import fs from 'fs';
import path from 'path';

/**
 * Get all KPIs with role-based filtering
 * - Employees see only their own KPIs
 * - HR sees KPIs assigned to HR (current_reviewer_role='HR' and status='SUBMITTED')
 * - Admin sees KPIs pending admin review (current_reviewer_role='ADMIN')
 */
export const getAllKPIs = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    let query = `
      SELECT k.*, e.employee_id AS employee_code, e.first_name, e.last_name, ac.name as category_name
      FROM hrms_kpis k
      JOIN hrms_employees e ON k.employee_id = e.id
      JOIN hrms_appraisal_categories ac ON k.appraisal_category_id = ac.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Get user's employee_details for self-view
    const [userRows]: any = await pool.query(
      'SELECT employee_id FROM hrms_users WHERE id = ?',
      [user.id]
    );
    const userEmpId = userRows[0]?.employee_id;

    // Role-based filtering
    if (user.role === 'employee') {
      // Employees see ONLY their own KPIs
      if (userEmpId) {
        query += ' AND k.employee_id = ?';
        params.push(userEmpId);
      } else {
        return res.json({ success: true, data: [] });
      }
    } else if (user.role === 'hr') {
      // HR sees:
      // 1. Their own KPIs
      // 2. Regular employee KPIs pending HR review (and NOT other HR staff)
      query += ` AND (
        (k.employee_id = ?)
        OR (k.current_reviewer_role = 'HR' AND k.status = 'HR_REVIEW')
      )`;
      params.push(userEmpId);
    } else if (user.role === 'admin') {
      // Admin sees:
      // 1. Their own KPIs
      // 2. KPIs in admin sequential review stages
      // 3. Completed KPIs
      query += ` AND (
        (k.employee_id = ?)
        OR (k.current_reviewer_role = 'ADMIN' AND k.status IN ('ADMIN_REVIEW', 'MANAGER_REVIEW', 'DEPT_HEAD_REVIEW', 'CEO_APPROVAL'))
        OR k.status = 'COMPLETED'
      )`;
      params.push(userEmpId);
    }
    // If role is not specified or is something else, show all (for backward compatibility)

    query += ' ORDER BY k.created_at DESC';

    const [rows]: any = await pool.query(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch KPIs' });
  }
};

/**
 * Get KPI by ID
 */
export const getKPIById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[getKPIById] Called with ID:', id, 'Path:', req.path, 'Original URL:', req.originalUrl);

    // Prevent matching /admin/review as an ID
    if (id === 'admin' || id === 'hr' || id === 'manager' || id === 'categories') {
      console.error('[getKPIById] Invalid ID parameter - looks like a route path:', id);
      return res.status(404).json({
        success: false,
        message: `Invalid KPI ID: ${id}. If you're trying to access a review endpoint, use /api/kpi/${id}/review instead.`
      });
    }

    const [rows]: any = await pool.query(
      `SELECT k.*, e.employee_id AS employee_code, e.first_name, e.last_name, ac.name as category_name
       FROM hrms_kpis k
       JOIN hrms_employees e ON k.employee_id = e.id
       JOIN hrms_appraisal_categories ac ON k.appraisal_category_id = ac.id
       WHERE k.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'KPI not found' });
    }

    // Fetch KPI items
    const [items]: any = await pool.query(
      'SELECT * FROM hrms_kpi_items WHERE kpi_id = ? ORDER BY id',
      [id]
    );

    // Fetch reviews
    const [reviews]: any = await pool.query(
      `SELECT kr.*, e.first_name, e.last_name
       FROM hrms_kpi_reviews kr
       JOIN hrms_employees e ON kr.reviewer_id = e.id
       WHERE kr.kpi_id = ? ORDER BY kr.created_at`,
      [id]
    );

    // Fetch comments
    const [comments]: any = await pool.query(
      `SELECT kc.*, e.first_name, e.last_name
       FROM hrms_kpi_comments kc
       JOIN hrms_employees e ON kc.author_id = e.id
       WHERE kc.kpi_id = ? ORDER BY kc.created_at`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        items,
        reviews,
        comments,
      },
    });
  } catch (error) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch KPI' });
  }
};

/**
 * Update KPI status (approval workflow)
 */
export const updateKPIStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewerId, reviewerRole, action, overallScore, overallComment } = req.body;

    if (!status || !reviewerId || !reviewerRole || !action) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get current KPI status
    const [currentKPI]: any = await pool.query('SELECT * FROM hrms_kpis WHERE id = ?', [id]);
    if (currentKPI.length === 0) {
      return res.status(404).json({ success: false, message: 'KPI not found' });
    }

    const fromStatus = currentKPI[0].status;
    let toStatus = status;

    // Update KPI status
    await pool.query(
      'UPDATE hrms_kpis SET status = ?, current_reviewer_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [toStatus, reviewerRole, id]
    );

    // If completed, set completed_at
    if (toStatus === 'COMPLETED') {
      await pool.query(
        'UPDATE hrms_kpis SET completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    // Create review record
    await pool.query(
      `INSERT INTO hrms_kpi_reviews (kpi_id, reviewer_id, reviewer_role, action, from_status, to_status, overall_score, overall_comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, reviewerId, reviewerRole, action, fromStatus, toStatus, overallScore || null, overallComment || null]
    );

    // Log activity
    await pool.query(
      `INSERT INTO hrms_kpi_activity_logs (kpi_id, actor_id, actor_role, type, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        reviewerId,
        reviewerRole,
        action === 'APPROVED' ? 'APPROVED' : 'RETURNED',
        JSON.stringify({ fromStatus, toStatus, overallScore, overallComment }),
      ]
    );

    // Auto-generate PDF when status is COMPLETED
    if (toStatus === 'COMPLETED') {
      try {
        await pdfService.generateKPIPDF(parseInt(id));
        console.log(`PDF generated automatically for KPI ${id}`);
      } catch (pdfError) {
        console.error('Error auto-generating PDF:', pdfError);
        // Don't fail the request if PDF generation fails
      }
    }

    res.json({
      success: true,
      message: 'KPI status updated successfully',
    });
  } catch (error) {
    console.error('Error updating KPI status:', error);
    res.status(500).json({ success: false, message: 'Failed to update KPI status' });
  }
};

/**
 * Create KPI
 */
export const createKPI = async (req: Request, res: Response) => {
  try {
    const { employeeId, periodYear, periodMonth, appraisalCategoryId, items } = req.body;

    if (!employeeId || !periodYear || !periodMonth || !appraisalCategoryId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate employee ID exists
    const [employeeCheck]: any = await pool.query(
      'SELECT id FROM hrms_employees WHERE id = ?',
      [employeeId]
    );
    if (employeeCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid employee ID: ${employeeId}. Please ensure your user account is linked to a valid employee record.`
      });
    }

    // Validate appraisal category ID exists
    const [categoryCheck]: any = await pool.query(
      'SELECT id FROM hrms_appraisal_categories WHERE id = ?',
      [appraisalCategoryId]
    );
    if (categoryCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid appraisal category ID: ${appraisalCategoryId}. Please select a valid appraisal category.`
      });
    }

    // Check if KPI already exists for this period
    const [existing]: any = await pool.query(
      'SELECT id, status FROM hrms_kpis WHERE employee_id = ? AND period_year = ? AND period_month = ?',
      [employeeId, periodYear, periodMonth]
    );

    if (existing.length > 0) {
      const existingKPI = existing[0];
      if (existingKPI.status === 'DRAFT') {
        return res.status(400).json({
          success: false,
          message: `A KPI already exists for ${periodYear}-${String(periodMonth).padStart(2, '0')} in DRAFT status. Please edit the existing KPI (ID: ${existingKPI.id}) or select a different period.`,
          existingKpiId: existingKPI.id
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `A KPI already exists for ${periodYear}-${String(periodMonth).padStart(2, '0')} with status: ${existingKPI.status}. Please select a different period or contact your administrator.`,
          existingKpiId: existingKPI.id
        });
      }
    }

    // Create KPI
    const [result]: any = await pool.query(
      `INSERT INTO hrms_kpis (employee_id, period_year, period_month, appraisal_category_id, status)
       VALUES (?, ?, ?, ?, 'DRAFT')`,
      [employeeId, periodYear, periodMonth, appraisalCategoryId]
    );

    const kpiId = result.insertId;

    // Create KPI items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO hrms_kpi_items (kpi_id, title, description, weight, employee_target)
           VALUES (?, ?, ?, ?, ?)`,
          [kpiId, item.title, item.description || null, item.weight || 0, item.employeeTarget]
        );
      }
    }

    res.json({
      success: true,
      message: 'KPI created successfully',
      data: { id: kpiId },
    });
  } catch (error: any) {
    console.error('Error creating KPI:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      sqlMessage: error.sqlMessage,
      body: req.body
    });

    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID or appraisal category. Please check your selections.'
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'KPI already exists for this period'
      });
    }

    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({
        success: false,
        message: 'Required fields cannot be empty. Please fill all required fields.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create KPI',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update KPI (Admin/HR can update any KPI, employees can only update their own)
 */
export const updateKPI = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { employeeId, periodYear, periodMonth, appraisalCategoryId, items } = req.body;
    const user = req.user as any;

    if (!employeeId || !periodYear || !periodMonth || !appraisalCategoryId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get current KPI
    const [currentKPI]: any = await pool.query('SELECT * FROM hrms_kpis WHERE id = ?', [id]);
    if (currentKPI.length === 0) {
      return res.status(404).json({ success: false, message: 'KPI not found' });
    }

    const kpi = currentKPI[0];

    // Check permissions: Admin/HR can edit any KPI, employees can only edit their own
    if (user.role !== 'admin' && user.role !== 'hr') {
      // Get user's employee_id
      const [userRows]: any = await pool.query(
        'SELECT employee_id FROM hrms_users WHERE id = ?',
        [user.id]
      );
      const userEmployeeId = userRows[0]?.employee_id;

      if (userEmployeeId !== kpi.employee_id) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own KPIs'
        });
      }
    }

    // Only allow editing if KPI is in DRAFT status (unless admin/HR)
    if (kpi.status !== 'DRAFT' && user.role !== 'admin' && user.role !== 'hr') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit KPI with status: ${kpi.status}. Only DRAFT KPIs can be edited.`
      });
    }

    // Validate employee ID exists
    const [employeeCheck]: any = await pool.query(
      'SELECT id FROM hrms_employees WHERE id = ?',
      [employeeId]
    );
    if (employeeCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid employee ID: ${employeeId}`
      });
    }

    // Validate appraisal category ID exists
    const [categoryCheck]: any = await pool.query(
      'SELECT id FROM hrms_appraisal_categories WHERE id = ?',
      [appraisalCategoryId]
    );
    if (categoryCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid appraisal category ID: ${appraisalCategoryId}`
      });
    }

    // Update KPI
    await pool.query(
      `UPDATE hrms_kpis 
       SET employee_id = ?, period_year = ?, period_month = ?, appraisal_category_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [employeeId, periodYear, periodMonth, appraisalCategoryId, id]
    );

    // Delete existing items
    await pool.query('DELETE FROM hrms_kpi_items WHERE kpi_id = ?', [id]);

    // Create new KPI items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO hrms_kpi_items (kpi_id, title, description, weight, employee_target)
           VALUES (?, ?, ?, ?, ?)`,
          [id, item.title, item.description || null, item.weight || 0, item.employeeTarget]
        );
      }
    }

    res.json({
      success: true,
      message: 'KPI updated successfully',
      data: { id: parseInt(id) },
    });
  } catch (error: any) {
    console.error('Error updating KPI:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update KPI',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Submit KPI for manager review
 */
export const submitKPIForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const user = req.user as any;
    // TEMP DEBUG
    if (user.username === 'hr1') {
      console.log('--- DEBUG: HIT SUBMIT KPI FOR REVIEW FOR HR1 ---');
    }

    // Get current KPI
    const [currentKPI]: any = await pool.query('SELECT * FROM hrms_kpis WHERE id = ?', [id]);
    if (currentKPI.length === 0) {
      return res.status(404).json({ success: false, message: 'KPI not found' });
    }

    // Get all KPI items for this KPI
    const [kpiItems]: any = await pool.query('SELECT id FROM hrms_kpi_items WHERE kpi_id = ? ORDER BY id', [id]);

    // Update KPI items with employee self-scores if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < Math.min(items.length, kpiItems.length); i++) {
        const item = items[i];
        const kpiItemId = kpiItems[i].id;
        if (item.employeeSelfScore !== undefined && item.employeeSelfScore !== null) {
          await pool.query(
            'UPDATE hrms_kpi_items SET employee_self_score = ? WHERE id = ?',
            [item.employeeSelfScore, kpiItemId]
          );
        }
      }
    }

    // Get user's employee_details to check if they are HR staff
    const [userEmployeeDetails]: any = await pool.query(
      `SELECT e.id, d.name as department_name, des.name as designation_name
       FROM hrms_users u
       LEFT JOIN hrms_employees e ON u.employee_id = e.id
       LEFT JOIN hrms_departments d ON e.department_id = d.id
       LEFT JOIN hrms_designations des ON e.designation_id = des.id
       WHERE u.id = ?`,
      [user.id]
    );

    const userEmp = userEmployeeDetails[0];
    const isUserHrStaff = user.role === 'hr' ||
      userEmp?.department_name?.toUpperCase().includes('HR') ||
      userEmp?.designation_name?.toUpperCase().includes('HR');

    // Get the details of the employee whose KPI is being submitted
    // We also join with users to check their role directly for more robust identification
    const [targetEmployeeDetails]: any = await pool.query(
      `SELECT e.id, e.employee_id AS employee_code, d.name as department_name, des.name as designation_name, u.role as user_role
       FROM hrms_employees e 
       LEFT JOIN hrms_departments d ON e.department_id = d.id
       LEFT JOIN hrms_designations des ON e.designation_id = des.id
       LEFT JOIN hrms_users u ON e.id = u.employee_id
       WHERE e.id = ?`,
      [currentKPI[0].employee_id]
    );

    const targetEmp = targetEmployeeDetails[0];

    // Identify if the target of the KPI is an HR staff member
    const targetUserRole = (targetEmp?.user_role || '').toUpperCase();
    const targetDept = (targetEmp?.department_name || '').toUpperCase();
    const targetDesig = (targetEmp?.designation_name || '').toUpperCase();
    const currentUserRole = (user.role || '').toUpperCase();
    const userEmpDept = (userEmp?.department_name || '').toUpperCase();
    const userEmpDesig = (userEmp?.designation_name || '').toUpperCase();
    const isSelfSubmission = userEmp?.id === currentKPI[0].employee_id;

    // Redundant flags for maximum reliability
    const isTargetHRByRole = targetUserRole === 'HR';
    const isSubmitterHRByRole = currentUserRole === 'HR';
    const isTargetHRByDept = targetDept.includes('HR') || targetDept.includes('HUMAN RESOURCE');
    const isSubmitterHRByDept = userEmpDept.includes('HR') || userEmpDept.includes('HUMAN RESOURCE');
    const isTargetHRByDesig = targetDesig.includes('HR');
    const isSubmitterHRByDesig = userEmpDesig.includes('HR');

    const isTargetHrStaff =
      isTargetHRByRole ||
      isSubmitterHRByRole ||
      isTargetHRByDept ||
      isSubmitterHRByDept ||
      isTargetHRByDesig ||
      isSubmitterHRByDesig;

    console.log(`[submitKPIForReview] V3_ROBUST Check:`, {
      isTargetHrStaff,
      isTargetHRByRole,
      isSubmitterHRByRole,
      isTargetHRByDept,
      isSubmitterHRByDept,
      currentUserRole,
      username: user.username
    });

    // Determine next status based on who is submitting
    let nextStatus: string;
    let nextReviewerRole: string;
    let submitterRole: string;
    let message: string;

    if (isTargetHrStaff) {
      // HR KPI Workflow: Any KPI for HR staff goes directly to Admin
      nextStatus = 'ADMIN_REVIEW';
      nextReviewerRole = 'ADMIN';
      submitterRole = isSelfSubmission ? 'EMPLOYEE' : (user.role || '').toUpperCase();
      message = 'HR Staff KPI submitted directly to Admin for review [V3_ROBUST]';
    } else if ((user.role || '').toLowerCase() === 'admin' && isSelfSubmission) {
      // Admin self-submission
      nextStatus = 'ADMIN_REVIEW';
      nextReviewerRole = 'ADMIN';
      submitterRole = 'ADMIN';
      message = 'Admin KPI submitted for review [V3_ROBUST]';
    } else {
      // Employee KPI Workflow: Regular employees go to HR
      nextStatus = 'HR_REVIEW';
      nextReviewerRole = 'HR';
      submitterRole = (user.role || '').toUpperCase();
      message = 'Employee KPI submitted for HR review [V3_ROBUST]';
    }

    console.log(`[submitKPIForReview] Final Routing - Status: ${nextStatus}, Reviewer: ${nextReviewerRole}`);

    // Update KPI status and set submitted_at
    await pool.query(
      `UPDATE hrms_kpis 
       SET status = ?, 
           current_reviewer_role = ?,
           submitted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [nextStatus, nextReviewerRole, id]
    );

    // Create review record
    await pool.query(
      `INSERT INTO hrms_kpi_reviews (kpi_id, reviewer_id, reviewer_role, action, from_status, to_status)
       VALUES (?, ?, ?, 'SUBMITTED', 'DRAFT', ?)`,
      [id, currentKPI[0].employee_id, submitterRole, nextStatus]
    );

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    console.error('Error submitting KPI:', error);
    res.status(500).json({ success: false, message: 'Failed to submit KPI' });
  }
};

/**
 * Get KPIs for HR review
 */
export const getKPIsForHRReview = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    console.log('[getKPIsForHRReview] User ID:', user.id, 'Role:', user.role);

    if (user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Access denied. Only HR can access this endpoint.' });
    }

    // Get user's employee_id from hrms_users table
    const [userRows]: any = await pool.query(
      'SELECT employee_id FROM hrms_users WHERE id = ?',
      [user.id]
    );

    const userEmployeeId = userRows[0]?.employee_id;

    // HR sees KPIs where current_reviewer_role = 'HR' and status = 'HR_REVIEW'
    // BUT we must filter out any HR staff that might have accidentally ended up here
    // Although the submission logic should prevent it, this is for extra safety and "vice versa" separation
    let query = `
      SELECT k.*, 
             e.employee_id AS employee_code, 
             e.first_name, 
             e.last_name, 
             e.department_id,
             ac.name as category_name,
             d.name as department_name,
             des.name as designation_name,
             u.role as user_role
      FROM hrms_kpis k
      JOIN hrms_employees e ON k.employee_id = e.id
      JOIN hrms_appraisal_categories ac ON k.appraisal_category_id = ac.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      LEFT JOIN hrms_users u ON e.id = u.employee_id
      WHERE k.current_reviewer_role = ? AND k.status = ?
    `;
    const params: any[] = ['HR', 'HR_REVIEW'];

    // Strictly separate: HR cannot see other HR staff KPIs in the HR Review flow
    // They can ONLY see regular employees (non-HR department/designation AND non-HR role)
    // We explicitly exclude anyone with 'hr' role to ensure complete separation
    query += ` AND (u.role IS NULL OR u.role != 'hr')`;
    query += ` AND (d.name IS NULL OR (
        d.name NOT LIKE '%HR%' AND 
        d.name NOT LIKE '%Human Resource%' AND 
        des.name NOT LIKE '%HR%'
      ))`;

    // Exclude their own KPIs (if they have an employee_id)
    if (userEmployeeId) {
      query += ' AND e.id != ?';
      params.push(userEmployeeId);
    }

    query += ' ORDER BY k.submitted_at DESC, k.created_at DESC';

    console.log('[getKPIsForHRReview] Query:', query, 'Params:', params);
    const [rows]: any = await pool.query(query, params);
    console.log('[getKPIsForHRReview] Found', rows.length, 'KPIs');

    // For each KPI, get its items
    const kpisWithItems = await Promise.all(
      rows.map(async (kpi: any) => {
        const [items]: any = await pool.query(
          'SELECT * FROM hrms_kpi_items WHERE kpi_id = ? ORDER BY id',
          [kpi.id]
        );
        return { ...kpi, items };
      })
    );

    res.json({ success: true, data: kpisWithItems });
  } catch (error: any) {
    console.error('[getKPIsForHRReview] Error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch KPIs for HR review: ${error.message || 'Unknown error'}`
    });
  }
};

/**
 * Get KPIs for Admin review - Only fetch KPIs with status='ADMIN_REVIEW' and current_reviewer_role='ADMIN'
 * This is the initial Admin review stage. Sequential stages (MANAGER_REVIEW, DEPT_HEAD_REVIEW, CEO_APPROVAL)
 * are handled within the Admin module but still have current_reviewer_role='ADMIN'
 */
export const getKPIsForAdminReview = async (req: Request, res: Response) => {
  try {
    console.log('[getKPIsForAdminReview] Endpoint called - Method:', req.method, 'Path:', req.path, 'Original URL:', req.originalUrl);
    const user = req.user as any;
    console.log('[getKPIsForAdminReview] User ID:', user?.id, 'Role:', user?.role);

    // Strict role validation - only admin can access
    if (!user || user.role !== 'admin') {
      console.error('[getKPIsForAdminReview] Access denied. User role:', user?.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Admin can access this endpoint.'
      });
    }

    // Admin sees KPIs where current_reviewer_role = 'ADMIN' 
    // And status is in one of the sequential admin stages.
    // We filter which ones to show based on the workflow stage.
    let query = `
      SELECT k.*, 
             e.employee_id AS employee_code, 
             e.first_name, 
             e.last_name, 
             e.department_id,
             ac.name as category_name,
             d.name as department_name,
             des.name as designation_name
      FROM hrms_kpis k
      JOIN hrms_employees e ON k.employee_id = e.id
      JOIN hrms_appraisal_categories ac ON k.appraisal_category_id = ac.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      WHERE k.current_reviewer_role = ? AND k.status IN (?, ?, ?, ?)
    `;
    const params: any[] = ['ADMIN', 'ADMIN_REVIEW', 'MANAGER_REVIEW', 'DEPT_HEAD_REVIEW', 'CEO_APPROVAL'];

    query += ' ORDER BY k.submitted_at DESC, k.created_at DESC';

    console.log('[getKPIsForAdminReview] Executing query with params:', params);
    const [rows]: any = await pool.query(query, params);
    console.log('[getKPIsForAdminReview] Found', rows.length, 'KPIs for Admin review');

    // For each KPI, get its items
    const kpisWithItems = await Promise.all(
      rows.map(async (kpi: any) => {
        const [items]: any = await pool.query(
          'SELECT * FROM hrms_kpi_items WHERE kpi_id = ? ORDER BY id',
          [kpi.id]
        );
        return { ...kpi, items };
      })
    );

    console.log('[getKPIsForAdminReview] Returning', kpisWithItems.length, 'KPIs with items');
    res.json({ success: true, data: kpisWithItems });
  } catch (error: any) {
    console.error('[getKPIsForAdminReview] Error:', error);
    console.error('[getKPIsForAdminReview] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: `Failed to fetch KPIs for Admin review: ${error.message || 'Unknown error'}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get KPIs for manager/admin review (backward compatibility - redirects to appropriate function)
 */
export const getKPIsForManagerReview = async (req: Request, res: Response) => {
  const user = req.user as any;
  if (user.role === 'hr') {
    return getKPIsForHRReview(req, res);
  } else if (user.role === 'admin') {
    return getKPIsForAdminReview(req, res);
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Only HR and admins can review KPIs.' });
  }
};

/**
 * Submit manager review for KPI
 */
export const submitManagerReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, overallComment, action } = req.body;
    const user = req.user as any;

    // Get manager's employee_id (optional - managers can review without being employees)
    const [userRows]: any = await pool.query(
      'SELECT employee_id, username FROM hrms_users WHERE id = ?',
      [user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let managerEmployeeId = userRows[0].employee_id;

    // If manager doesn't have employee_id, we'll use the KPI's employee_id as a fallback
    // for the review record (this is just for tracking purposes)
    // The actual reviewer is identified by the user.id in the system
    if (!managerEmployeeId) {
      console.log(`[submitManagerReview] Manager ${userRows[0].username} (user ID: ${user.id}) doesn't have employee_id. Using system review.`);
      // We'll use a system employee ID or the employee being reviewed for the foreign key constraint
      // For now, we'll get the employee_id from the KPI itself
    }

    // Get current KPI
    const [currentKPI]: any = await pool.query('SELECT * FROM hrms_kpis WHERE id = ?', [id]);
    if (currentKPI.length === 0) {
      return res.status(404).json({ success: false, message: 'KPI not found' });
    }

    const currentStatus = currentKPI[0].status;
    const currentReviewerRole = currentKPI[0].current_reviewer_role;

    // Determine reviewer role and allowed statuses based on user role
    let reviewerRole: string;
    let allowedStatuses: string[];
    let allowedReviewerRoles: string[];
    let scoreField: string;

    if (user.role === 'hr') {
      // HR can only review KPIs with status='HR_REVIEW' and current_reviewer_role='HR'
      reviewerRole = 'HR';
      allowedStatuses = ['HR_REVIEW'];
      allowedReviewerRoles = ['HR'];
      scoreField = 'hr_score';
    } else if (user.role === 'admin') {
      // Admin can review KPIs in sequential stages: ADMIN_REVIEW → MANAGER_REVIEW → DEPT_HEAD_REVIEW → CEO_APPROVAL
      reviewerRole = 'ADMIN';
      allowedStatuses = ['ADMIN_REVIEW', 'MANAGER_REVIEW', 'DEPT_HEAD_REVIEW', 'CEO_APPROVAL'];
      allowedReviewerRoles = ['ADMIN'];

      // Determine which score field to use based on current status
      if (currentStatus === 'ADMIN_REVIEW') {
        scoreField = 'manager_score'; // Admin acting as Manager
      } else if (currentStatus === 'MANAGER_REVIEW') {
        scoreField = 'dept_head_score'; // Admin acting as Dept Head
      } else if (currentStatus === 'DEPT_HEAD_REVIEW') {
        scoreField = 'ceo_score'; // Admin acting as CEO
      } else if (currentStatus === 'CEO_APPROVAL') {
        scoreField = 'ceo_score'; // Final CEO approval
      } else {
        scoreField = 'hr_score'; // Default
      }
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Only HR and admins can review KPIs.' });
    }

    // Check if KPI is in an allowed status and reviewer role for this reviewer
    if (!allowedStatuses.includes(currentStatus) || !allowedReviewerRoles.includes(currentReviewerRole || '')) {
      if (user.role === 'hr') {
        return res.status(400).json({
          success: false,
          message: `KPI is in ${currentStatus} status. Only KPIs with status 'HR_REVIEW' and assigned to HR can be reviewed.`
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `KPI is in ${currentStatus} status. Admin can only review KPIs in ADMIN_REVIEW, MANAGER_REVIEW, DEPT_HEAD_REVIEW, or CEO_APPROVAL stages.`
        });
      }
    }

    // If reviewer doesn't have employee_id, use the employee being reviewed's ID for the foreign key constraint
    if (!managerEmployeeId) {
      managerEmployeeId = currentKPI[0].employee_id;
      console.log(`[submitManagerReview] Using employee ID ${managerEmployeeId} for foreign key constraint (reviewer user ID: ${user.id}, role: ${reviewerRole})`);
    }

    // Update KPI items with reviewer scores
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          await pool.query(
            `UPDATE hrms_kpi_items SET ${scoreField} = ? WHERE id = ?`,
            [item.managerScore || null, item.id]
          );
        }
      }
    }

    // Calculate overall score (average of reviewer scores)
    let overallScore = null;
    if (items && Array.isArray(items) && items.length > 0) {
      const scores = items
        .map((item: any) => item.managerScore)
        .filter((score: any) => score !== null && score !== undefined);
      if (scores.length > 0) {
        overallScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      }
    }

    // Determine next status based on action and current stage
    let nextStatus: string | null = null;
    let nextReviewerRole: string | null = null;

    if (action === 'RETURNED') {
      nextStatus = 'RETURNED_FOR_CHANGES';
      nextReviewerRole = 'EMPLOYEE';
    } else if (action === 'APPROVED') {
      if (user.role === 'hr') {
        // HR approves: Move to Admin with ADMIN_REVIEW status and current_reviewer_role = 'ADMIN'
        if (currentStatus === 'HR_REVIEW' && currentReviewerRole === 'HR') {
          nextStatus = 'ADMIN_REVIEW';
          nextReviewerRole = 'ADMIN';
          console.log(`[submitManagerReview] HR approving KPI ${id}: ${currentStatus} → ${nextStatus}, reviewer role: ${currentReviewerRole} → ${nextReviewerRole}`);
        } else {
          console.error(`[submitManagerReview] Invalid KPI status for HR approval. Current status: ${currentStatus}, reviewer role: ${currentReviewerRole}`);
          return res.status(400).json({
            success: false,
            message: `Invalid KPI status for HR approval. Expected HR_REVIEW with HR reviewer, got ${currentStatus} with ${currentReviewerRole}`
          });
        }
      } else if (user.role === 'admin') {
        // Admin sequential reviews: ADMIN_REVIEW → MANAGER_REVIEW → DEPT_HEAD_REVIEW → CEO_APPROVAL → COMPLETED
        if (currentStatus === 'ADMIN_REVIEW' && currentReviewerRole === 'ADMIN') {
          nextStatus = 'MANAGER_REVIEW';
          nextReviewerRole = 'ADMIN'; // Still assigned to Admin for next stage
        } else if (currentStatus === 'MANAGER_REVIEW' && currentReviewerRole === 'ADMIN') {
          nextStatus = 'DEPT_HEAD_REVIEW';
          nextReviewerRole = 'ADMIN'; // Still assigned to Admin for next stage
        } else if (currentStatus === 'DEPT_HEAD_REVIEW' && currentReviewerRole === 'ADMIN') {
          nextStatus = 'CEO_APPROVAL';
          nextReviewerRole = 'ADMIN'; // Still assigned to Admin for final stage
        } else if (currentStatus === 'CEO_APPROVAL' && currentReviewerRole === 'ADMIN') {
          nextStatus = 'COMPLETED';
          nextReviewerRole = null; // Workflow complete - null is valid here
          console.log(`[submitManagerReview] Admin completing KPI ${id}: ${currentStatus} → ${nextStatus}, workflow complete`);
        } else {
          console.error(`[submitManagerReview] Invalid KPI status for Admin approval. Current status: ${currentStatus}, reviewer role: ${currentReviewerRole}`);
          return res.status(400).json({ success: false, message: `Invalid KPI status ${currentStatus} for Admin review` });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Access denied. Only HR and admins can review KPIs.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use APPROVED or RETURNED.' });
    }

    // Safety check - nextReviewerRole can be null when status is COMPLETED
    if (nextStatus === null) {
      console.error(`[submitManagerReview] Failed to determine next status. Current status: ${currentStatus}, action: ${action}, user role: ${user.role}`);
      return res.status(500).json({ success: false, message: 'Internal error: Failed to determine next status' });
    }

    // nextReviewerRole is allowed to be null when workflow is complete (status = COMPLETED)
    if (nextReviewerRole === null && nextStatus !== 'COMPLETED') {
      console.error(`[submitManagerReview] Invalid state: nextReviewerRole is null but status is not COMPLETED. Status: ${nextStatus}`);
      return res.status(500).json({ success: false, message: 'Internal error: Invalid workflow state' });
    }

    // Update KPI status
    console.log(`[submitManagerReview] Updating KPI ${id}: status=${nextStatus}, current_reviewer_role=${nextReviewerRole || 'NULL'}`);

    // Build update query - handle null reviewer role for COMPLETED status
    let updateQuery: string;
    let updateParams: any[];

    if (nextStatus === 'COMPLETED') {
      // When completing, set status, completed_at, and clear reviewer role
      updateQuery = `UPDATE hrms_kpis 
                     SET status = ?, 
                         current_reviewer_role = NULL,
                         completed_at = CURRENT_TIMESTAMP,
                         updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`;
      updateParams = [nextStatus, id];
    } else {
      // For other statuses, set status and reviewer role
      updateQuery = `UPDATE hrms_kpis 
                     SET status = ?, 
                         current_reviewer_role = ?,
                         updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`;
      updateParams = [nextStatus, nextReviewerRole, id];
    }

    const [updateResult]: any = await pool.query(updateQuery, updateParams);
    console.log(`[submitManagerReview] KPI ${id} updated. Rows affected:`, updateResult.affectedRows);

    // Verify the update
    const [verifyKPI]: any = await pool.query('SELECT id, status, current_reviewer_role, completed_at FROM hrms_kpis WHERE id = ?', [id]);
    if (verifyKPI.length > 0) {
      console.log(`[submitManagerReview] Verified KPI ${id} update: status=${verifyKPI[0].status}, current_reviewer_role=${verifyKPI[0].current_reviewer_role || 'NULL'}, completed_at=${verifyKPI[0].completed_at || 'NULL'}`);
    }

    // Create review record
    await pool.query(
      `INSERT INTO hrms_kpi_reviews (kpi_id, reviewer_id, reviewer_role, action, from_status, to_status, overall_score, overall_comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, managerEmployeeId, reviewerRole, action || 'APPROVED', currentStatus, nextStatus, overallScore, overallComment || null]
    );

    // Determine success message based on action and final status
    let successMessage = '';
    if (action === 'RETURNED') {
      successMessage = 'KPI returned for changes.';
    } else if (nextStatus === 'COMPLETED') {
      successMessage = 'KPI approved and completed successfully!';
    } else {
      successMessage = `KPI approved and moved to ${nextStatus} stage.`;
    }

    res.json({
      success: true,
      message: successMessage,
      data: {
        kpiId: id,
        newStatus: nextStatus,
        completed: nextStatus === 'COMPLETED'
      }
    });
  } catch (error) {
    console.error('Error submitting manager review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit manager review' });
  }
};

