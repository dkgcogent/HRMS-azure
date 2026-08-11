import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// -----------------------------------------
// TEMPLATES
// -----------------------------------------

export const getKRATemplates = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM kra_templates ORDER BY lastUpdated DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKRATemplateById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [templateRows] = await pool.query<RowDataPacket[]>('SELECT * FROM kra_templates WHERE id = ?', [id]);
    if (templateRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    const template = templateRows[0];

    const [itemRows] = await pool.query<RowDataPacket[]>('SELECT * FROM kra_template_items WHERE template_id = ?', [id]);
    template.items = itemRows;

    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createKRATemplate = async (req: Request, res: Response) => {
  const { id, name, department, designation, financialYear, effectiveFrom, effectiveTo, status, items } = req.body;
  const templateId = id || `KRA-${Date.now()}`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS kra_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        department VARCHAR(255),
        designation VARCHAR(255),
        financialYear VARCHAR(50),
        effectiveFrom VARCHAR(50),
        effectiveTo VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Draft',
        lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await connection.query(`
      CREATE TABLE IF NOT EXISTS kra_template_items (
        id VARCHAR(255) PRIMARY KEY,
        template_id VARCHAR(255),
        kraName VARCHAR(255),
        description TEXT,
        frequency VARCHAR(50),
        weightage DECIMAL(5,2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await connection.query(`
      CREATE TABLE IF NOT EXISTS kra_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100),
        user VARCHAR(255),
        module VARCHAR(100),
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await connection.query(
      'INSERT INTO kra_templates (id, name, department, designation, financialYear, effectiveFrom, effectiveTo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        templateId,
        name || 'Untitled KRA',
        department || '',
        designation || '',
        financialYear || '2026-2027',
        effectiveFrom || null,
        effectiveTo || null,
        status || 'Draft'
      ]
    );

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = item.id || `ITEM-${Date.now()}-${i}`;
        await connection.query(
          'INSERT INTO kra_template_items (id, template_id, kraName, description, frequency, weightage) VALUES (?, ?, ?, ?, ?, ?)',
          [
            itemId,
            templateId,
            item.kraName || '',
            item.description || '',
            item.frequency || 'Yearly',
            item.weightage !== undefined && item.weightage !== null ? Number(item.weightage) : 0
          ]
        );
      }
    }

    await connection.query(
      'INSERT INTO kra_audit_logs (action, user, module, description) VALUES (?, ?, ?, ?)',
      ['CREATE', 'Admin User', 'Template', `Created KRA Template: ${name || templateId}`]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'Template created successfully' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error in createKRATemplate:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

export const updateKRATemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, department, designation, financialYear, effectiveFrom, effectiveTo, status, items } = req.body;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE kra_templates SET name = ?, department = ?, designation = ?, financialYear = ?, effectiveFrom = ?, effectiveTo = ?, status = ? WHERE id = ?',
      [
        name || 'Untitled KRA',
        department || '',
        designation || '',
        financialYear || '2026-2027',
        effectiveFrom || null,
        effectiveTo || null,
        status || 'Draft',
        id
      ]
    );

    await connection.query('DELETE FROM kra_template_items WHERE template_id = ?', [id]);

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = item.id || `ITEM-${Date.now()}-${i}`;
        await connection.query(
          'INSERT INTO kra_template_items (id, template_id, kraName, description, frequency, weightage) VALUES (?, ?, ?, ?, ?, ?)',
          [
            itemId,
            id,
            item.kraName || '',
            item.description || '',
            item.frequency || 'Yearly',
            item.weightage !== undefined && item.weightage !== null ? Number(item.weightage) : 0
          ]
        );
      }
    }

    await connection.query(
      'INSERT INTO kra_audit_logs (action, user, module, description) VALUES (?, ?, ?, ?)',
      ['UPDATE', 'Admin User', 'Template', `Updated KRA Template: ${name || id}`]
    );

    await connection.commit();
    res.json({ success: true, message: 'Template updated successfully' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error in updateKRATemplate:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

export const deleteKRATemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM kra_template_items WHERE template_id = ?', [id]).catch(() => {});
    await pool.query('DELETE FROM kra_assignments WHERE templateId = ?', [id]).catch(() => {});
    await pool.query('DELETE FROM kra_templates WHERE id = ?', [id]);
    await pool.query(
      'INSERT INTO kra_audit_logs (action, user, module, description) VALUES (?, ?, ?, ?)',
      ['DELETE', 'Admin User', 'Template', `Deleted KRA Template ID: ${id}`]
    ).catch(() => {});
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting KRA template:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
// ASSIGNMENTS
// -----------------------------------------

export const getKRAAssignments = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT a.*, t.name as templateName 
      FROM kra_assignments a
      JOIN kra_templates t ON a.templateId = t.id
      ORDER BY a.assignedDate DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignKRATemplate = async (req: Request, res: Response) => {
  const { templateId, employees, reportingManager, effectiveDate } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const empId of employees) {
      await connection.query(
        'INSERT INTO kra_assignments (templateId, employeeId, reportingManagerId, assignedDate) VALUES (?, ?, ?, ?)',
        [templateId, empId, reportingManager, effectiveDate]
      );
    }

    await connection.query(
      'INSERT INTO kra_audit_logs (action, user, module, description) VALUES (?, ?, ?, ?)',
      ['ASSIGN', 'Admin User', 'Assignment', `Assigned template ${templateId} to ${employees.length} employees`]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'Assignments created successfully' });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

export const removeKRAAssignment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM kra_assignments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Assignment removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
// AUDIT LOGS
// -----------------------------------------

export const getKRAAuditLogs = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM kra_audit_logs ORDER BY date DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
// MY KRA (EMPLOYEE SELF-SERVICE)
// -----------------------------------------

export const getMyKRA = async (req: Request, res: Response) => {
  try {
    const { employeeId, financialYear } = req.query;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const empIdStr = String(employeeId);

    // Auto-create tables if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kra_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        department VARCHAR(255),
        designation VARCHAR(255),
        financialYear VARCHAR(50),
        effectiveFrom VARCHAR(50),
        effectiveTo VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Draft',
        lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kra_template_items (
        id VARCHAR(255) PRIMARY KEY,
        template_id VARCHAR(255),
        kraName VARCHAR(255),
        description TEXT,
        frequency VARCHAR(50),
        weightage DECIMAL(5,2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kra_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        templateId VARCHAR(255),
        employeeId VARCHAR(255),
        reportingManagerId VARCHAR(255),
        assignedDate VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kra_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(255),
        template_id VARCHAR(255),
        item_id VARCHAR(255),
        financial_year VARCHAR(50),
        month VARCHAR(50),
        emp_score DECIMAL(10,2) DEFAULT NULL,
        rm_score DECIMAL(10,2) DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_emp_item_month (employee_id, item_id, month, financial_year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    let templateId = null;
    let assignment = null;

    // Build comprehensive employee identifiers
    const targetFY = (financialYear as string) || '2026-2027';
    let candidateEmpIds: string[] = [empIdStr];
    let fullName = '';
    let deptId = '';
    let deptName = '';
    let desigId = '';
    let desigName = '';

    try {
      const [empRows] = await pool.query<RowDataPacket[]>(
        `SELECT e.*, d.name AS department_name, des.name AS designation_name
         FROM hrms_employees e
         LEFT JOIN hrms_departments d ON e.department_id = d.id
         LEFT JOIN hrms_designations des ON e.designation_id = des.id
         WHERE e.id = ? OR e.employee_id = ?`,
        [empIdStr, empIdStr]
      );

      if (empRows.length > 0) {
        const emp = empRows[0];
        if (emp.id) candidateEmpIds.push(String(emp.id));
        if (emp.employee_id) candidateEmpIds.push(String(emp.employee_id));
        fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
        deptId = emp.department_id ? String(emp.department_id) : '';
        deptName = emp.department_name || '';
        desigId = emp.designation_id ? String(emp.designation_id) : '';
        desigName = emp.designation_name || '';
      }

      const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT u.id as user_id, u.full_name, u.username, u.employee_id as user_emp_id,
                e.id as emp_id, e.employee_id as emp_code, e.first_name, e.last_name,
                COALESCE(e.department_id, u.department_id) as department_id, e.designation_id,
                d.name AS department_name, des.name AS designation_name
         FROM hrms_users u
         LEFT JOIN hrms_employees e ON (u.employee_id = e.id OR u.username = e.employee_id)
         LEFT JOIN hrms_departments d ON COALESCE(e.department_id, u.department_id) = d.id
         LEFT JOIN hrms_designations des ON e.designation_id = des.id
         WHERE u.id = ? OR u.employee_id = ? OR u.username = ?`,
        [empIdStr, empIdStr, empIdStr]
      );

      if (userRows.length > 0) {
        const usr = userRows[0];
        if (usr.user_id) candidateEmpIds.push(String(usr.user_id));
        if (usr.user_emp_id) candidateEmpIds.push(String(usr.user_emp_id));
        if (usr.username) candidateEmpIds.push(String(usr.username));
        if (usr.emp_id) candidateEmpIds.push(String(usr.emp_id));
        if (usr.emp_code) candidateEmpIds.push(String(usr.emp_code));
        if (!fullName && usr.full_name) fullName = usr.full_name;
        if (!deptId && usr.department_id) deptId = String(usr.department_id);
        if (!deptName && usr.department_name) deptName = usr.department_name;
        if (!desigId && usr.designation_id) desigId = String(usr.designation_id);
        if (!desigName && usr.designation_name) desigName = usr.designation_name;
      }
    } catch (e) {
      console.warn('Note employee info resolution error:', e);
    }

    candidateEmpIds = Array.from(new Set(candidateEmpIds.filter(Boolean)));

    // Step 1: Direct Assignment lookup by candidate employee IDs
    if (candidateEmpIds.length > 0) {
      try {
        const [assignmentRows] = await pool.query<RowDataPacket[]>(
          `SELECT a.*, t.financialYear as t_fy
           FROM kra_assignments a
           JOIN kra_templates t ON a.templateId = t.id
           WHERE a.employeeId IN (?)
           ORDER BY (CASE WHEN t.financialYear = ? THEN 1 ELSE 2 END), a.id DESC
           LIMIT 1`,
          [candidateEmpIds, targetFY]
        );
        if (assignmentRows.length > 0) {
          assignment = assignmentRows[0];
          templateId = assignment.templateId;
        }
      } catch (e) {
        console.warn('Note assignment lookup:', e);
      }
    }

    // Step 2: Match by Template Name (e.g., template named after employee)
    if (!templateId && fullName) {
      try {
        const [nameMatched] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM kra_templates
           WHERE (name IS NOT NULL AND name != '' AND (name = ? OR name LIKE ?))
           ORDER BY (CASE WHEN financialYear = ? THEN 1 ELSE 2 END), (CASE WHEN status = 'Active' THEN 1 ELSE 2 END), lastUpdated DESC
           LIMIT 1`,
          [fullName, `%${fullName}%`, targetFY]
        );
        if (nameMatched.length > 0) {
          templateId = nameMatched[0].id;
        }
      } catch (e) {
        console.warn('Note name match lookup:', e);
      }
    }

    // Step 3: Match by Department or Designation (IDs or Names)
    if (!templateId && (deptId || deptName || desigId || desigName)) {
      try {
        const [deptMatched] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM kra_templates
           WHERE (
             (department IS NOT NULL AND department != '' AND (department = ? OR department = ?)) OR
             (designation IS NOT NULL AND designation != '' AND (designation = ? OR designation = ?))
           )
           ORDER BY (CASE WHEN status = 'Active' THEN 1 ELSE 2 END), (CASE WHEN financialYear = ? THEN 1 ELSE 2 END), lastUpdated DESC
           LIMIT 1`,
          [deptId || '__none__', deptName || '__none__', desigId || '__none__', desigName || '__none__', targetFY]
        );
        if (deptMatched.length > 0) {
          templateId = deptMatched[0].id;
        }
      } catch (e) {
        console.warn('Note department/designation lookup:', e);
      }
    }

    // Step 4: Fallback - any active template in the system
    if (!templateId) {
      try {
        const [fallbackMatched] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM kra_templates
           ORDER BY (CASE WHEN status = 'Active' THEN 1 ELSE 2 END), (CASE WHEN financialYear = ? THEN 1 ELSE 2 END), lastUpdated DESC
           LIMIT 1`,
          [targetFY]
        );
        if (fallbackMatched.length > 0) {
          templateId = fallbackMatched[0].id;
        }
      } catch (e) {
        console.warn('Note fallback lookup:', e);
      }
    }

    if (!templateId) {
      return res.json({ success: true, data: { template: null, items: [], scores: {} } });
    }

    // Fetch Template & Items
    const [templateRows] = await pool.query<RowDataPacket[]>('SELECT * FROM kra_templates WHERE id = ?', [templateId]);
    const template = templateRows[0] || null;

    const [itemRows] = await pool.query<RowDataPacket[]>('SELECT * FROM kra_template_items WHERE template_id = ?', [templateId]);

    // Fetch Scores from kra_scores
    let scoreRows: RowDataPacket[] = [];
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM kra_scores WHERE employee_id IN (?) AND financial_year = ?',
        [candidateEmpIds, targetFY]
      );
      scoreRows = rows;
    } catch (e) {
      console.warn('Note scores lookup:', e);
    }

    const scoresMap: Record<string, { empScore: number | null; rmScore: number | null }> = {};
    for (const score of scoreRows) {
      const key = `${score.item_id}_${score.month}`;
      scoresMap[key] = {
        empScore: score.emp_score !== null ? Number(score.emp_score) : null,
        rmScore: score.rm_score !== null ? Number(score.rm_score) : null,
      };
    }

    res.json({
      success: true,
      data: {
        template,
        items: itemRows,
        assignment,
        scores: scoresMap,
      }
    });
  } catch (error: any) {
    console.error('Error fetching My KRA:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveMyKRAScores = async (req: Request, res: Response) => {
  const { employeeId, financialYear, templateId, scores } = req.body;
  if (!employeeId || !scores || !Array.isArray(scores)) {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS kra_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(255),
        template_id VARCHAR(255),
        item_id VARCHAR(255),
        financial_year VARCHAR(50),
        month VARCHAR(50),
        emp_score DECIMAL(10,2) DEFAULT NULL,
        rm_score DECIMAL(10,2) DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_emp_item_month (employee_id, item_id, month, financial_year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    for (const item of scores) {
      const { itemId, month, empScore, rmScore } = item;
      await connection.query(
        `INSERT INTO kra_scores (employee_id, template_id, item_id, financial_year, month, emp_score, rm_score)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           emp_score = COALESCE(VALUES(emp_score), emp_score),
           rm_score = COALESCE(VALUES(rm_score), rm_score)`,
        [
          String(employeeId),
          templateId || '',
          String(itemId),
          financialYear || '2026-2027',
          String(month),
          empScore !== undefined && empScore !== '' && empScore !== null ? Number(empScore) : null,
          rmScore !== undefined && rmScore !== '' && rmScore !== null ? Number(rmScore) : null,
        ]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'KRA scores saved successfully' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error saving My KRA scores:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
