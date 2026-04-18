
import { Request, Response } from 'express';
import pool from '../db';

// Define upload base directory on D: drive
import { UPLOAD_BASE_DIR } from '../config/uploadConfig';

// Utility function to convert ISO date string to MySQL date format (YYYY-MM-DD)
const formatDateForMySQL = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return null;
  }
};

// Utility function to format Date object to YYYY-MM-DD string for frontend display
const formatDateForDisplay = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return null;
  }
};

// Utility function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Utility function to convert database row (snake_case) to camelCase object
const convertRowToCamelCase = (row: any): any => {
  if (!row) return row;
  const camelCaseRow: any = {};
  for (const key in row) {
    if (row.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      camelCaseRow[camelKey] = row[key];
    }
  }
  return camelCaseRow;
};

// Utility function to convert array of rows to camelCase
const convertRowsToCamelCase = (rows: any[]): any[] => {
  return rows.map(row => convertRowToCamelCase(row));
};

// Utility function to generate the next employee ID (e.g., EMP001, EMP002, etc.)
const generateEmployeeId = async (): Promise<string> => {
  try {
    // Query to find the highest employee ID number
    const [rows]: any = await pool.query(`
      SELECT employee_id
      FROM hrms_employees
      WHERE employee_id IS NOT NULL
      AND employee_id LIKE 'EMP%'
      ORDER BY CAST(SUBSTRING(employee_id, 4) AS UNSIGNED) DESC
      LIMIT 1
    `);

    let nextNumber = 1;
    if (rows.length > 0 && rows[0].employee_id) {
      // Extract the number from the employee ID (e.g., "EMP005" -> 5)
      const currentNumber = parseInt(rows[0].employee_id.substring(3), 10);
      nextNumber = currentNumber + 1;
    }

    // Format with zero-padding (e.g., 1 -> "EMP001", 25 -> "EMP025")
    const employeeId = `EMP${String(nextNumber).padStart(3, '0')}`;
    console.log(`Generated employee ID: ${employeeId}`);
    return employeeId;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw error;
  }
};

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    let query = `
      SELECT
        e.*,
        d.name as department_name,
        des.name as designation_name,
        c.name as customer_name,
        c.code as customer_code,
        p.name as project_name,
        p.code as project_code,
        (SELECT monthly_ctc FROM hrms_offer_letters WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1) as salary
      FROM hrms_employees e
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      LEFT JOIN hrms_customers c ON e.customer_id = c.id
      LEFT JOIN hrms_projects p ON e.project_id = p.id
    `;

    let countQuery = `SELECT COUNT(*) as total FROM hrms_employees e`;
    const queryParams: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      query += ` WHERE e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ?`;
      countQuery += ` WHERE e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ?`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY e.id DESC LIMIT ? OFFSET ?`;
    const finalQueryParams = [...queryParams, limit, skip];

    const [rows]: any = await pool.query(query, finalQueryParams);
    const [totalRows]: any = await pool.query(countQuery, queryParams);

    const totalElements = totalRows[0].total;
    const totalPages = Math.ceil(totalElements / limit);

    const camelCaseRows = convertRowsToCamelCase(rows);

    // Format date fields for frontend display
    camelCaseRows.forEach((employee: any) => {
      if (employee.dateOfBirth) {
        employee.dateOfBirth = formatDateForDisplay(employee.dateOfBirth);
      }
      if (employee.joiningDate) {
        employee.joiningDate = formatDateForDisplay(employee.joiningDate);
      }
    });

    res.json({
      success: true,
      message: "Employees fetched successfully",
      data: {
        content: camelCaseRows,
        totalElements,
        totalPages,
        size: limit,
        number: page
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(`
      SELECT
        e.*,
        c.code as customer_code,
        p.code as project_code,
        (SELECT monthly_ctc FROM hrms_offer_letters WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1) as salary
      FROM hrms_employees e
      LEFT JOIN hrms_customers c ON e.customer_id = c.id
      LEFT JOIN hrms_projects p ON e.project_id = p.id
      WHERE e.id = ?
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const camelCaseEmployee = convertRowToCamelCase(rows[0]);

    // Format date fields for frontend display
    if (camelCaseEmployee.dateOfBirth) {
      camelCaseEmployee.dateOfBirth = formatDateForDisplay(camelCaseEmployee.dateOfBirth);
    }
    if (camelCaseEmployee.joiningDate) {
      camelCaseEmployee.joiningDate = formatDateForDisplay(camelCaseEmployee.joiningDate);
    }

    // Fetch employee qualifications
    const [qualificationRows]: any = await pool.query(
      'SELECT qualification_id FROM hrms_employee_qualifications WHERE employee_id = ?',
      [id]
    );
    camelCaseEmployee.qualificationIds = qualificationRows.map((row: any) => row.qualification_id);

    res.json({ success: true, message: "Employee fetched successfully", data: camelCaseEmployee });
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  console.log('=== CREATE EMPLOYEE REQUEST START ===');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  let {
    employeeId, firstName, middleName, lastName, gender, dateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate, status = 'ACTIVE', bankId, accountNumber, paymentModeId, customerId, projectId,
    emergencyContactName, emergencyContactNumber, emergencyContactRelation, personalEmail, alternateNumber, maritalStatus, bloodGroup, qualificationIds
  } = req.body;

  // Auto-generate employee ID if not provided
  if (!employeeId) {
    employeeId = await generateEmployeeId();
    console.log('Auto-generated employee ID:', employeeId);
  }

  console.log('Extracted fields:', {
    employeeId, firstName, middleName, lastName, gender, dateOfBirth, mobile, email, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate, status, bankId, accountNumber, paymentModeId
  });

  // Validate required fields
  if (!firstName || !lastName || !dateOfBirth || !mobile || !manpowerTypeId || !departmentId || !designationId || !workLocationId || !shiftId || !joiningDate) {
    console.log('Validation failed: Required fields missing');
    return res.status(400).json({
      success: false,
      message: 'Required fields are missing: firstName, lastName, dateOfBirth, mobile, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate'
    });
  }

  // Validate foreign key values are valid numbers and not zero
  const requiredIds = { manpowerTypeId, departmentId, designationId, workLocationId, shiftId };
  for (const [field, value] of Object.entries(requiredIds)) {
    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
      return res.status(400).json({
        success: false,
        message: `${field} must be a valid positive integer`
      });
    }
  }

  // Validate optional foreign keys if provided
  if (bankId && (!Number.isInteger(Number(bankId)) || Number(bankId) <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'bankId must be a valid positive integer'
    });
  }

  if (paymentModeId && (!Number.isInteger(Number(paymentModeId)) || Number(paymentModeId) <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'paymentModeId must be a valid positive integer'
    });
  }

  try {
    console.log('=== FOREIGN KEY VALIDATION START ===');
    // Verify foreign key constraints exist
    console.log('Validating foreign keys...');
    const [manpowerResult] = await pool.query('SELECT id FROM hrms_manpower_types WHERE id = ?', [manpowerTypeId]);
    const [departmentResult] = await pool.query('SELECT id FROM hrms_departments WHERE id = ?', [departmentId]);
    const [designationResult] = await pool.query('SELECT id FROM hrms_designations WHERE id = ?', [designationId]);
    const [workLocationResult] = await pool.query('SELECT id FROM hrms_work_locations WHERE id = ?', [workLocationId]);
    const [shiftResult] = await pool.query('SELECT id FROM hrms_shifts WHERE id = ?', [shiftId]);

    console.log('Foreign key validation results:', {
      manpowerTypeId: { value: manpowerTypeId, found: (manpowerResult as any[]).length > 0 },
      departmentId: { value: departmentId, found: (departmentResult as any[]).length > 0 },
      designationId: { value: designationId, found: (designationResult as any[]).length > 0 },
      workLocationId: { value: workLocationId, found: (workLocationResult as any[]).length > 0 },
      shiftId: { value: shiftId, found: (shiftResult as any[]).length > 0 }
    });

    // Check if any foreign key references don't exist
    const missingRefs = [];
    if ((manpowerResult as any[]).length === 0) missingRefs.push('manpowerTypeId');
    if ((departmentResult as any[]).length === 0) missingRefs.push('departmentId');
    if ((designationResult as any[]).length === 0) missingRefs.push('designationId');
    if ((workLocationResult as any[]).length === 0) missingRefs.push('workLocationId');
    if ((shiftResult as any[]).length === 0) missingRefs.push('shiftId');

    if (missingRefs.length > 0) {
      console.log('Foreign key validation failed:', missingRefs);
      return res.status(400).json({
        success: false,
        message: `Invalid foreign key references: ${missingRefs.join(', ')}. Please ensure these master data records exist.`
      });
    }
    console.log('=== FOREIGN KEY VALIDATION PASSED ===');

    // Format dates for MySQL
    const formattedDateOfBirth = formatDateForMySQL(dateOfBirth);
    const formattedJoiningDate = formatDateForMySQL(joiningDate);

    console.log('=== DATABASE INSERTION START ===');
    const insertData = [
      employeeId, firstName, middleName, lastName, gender, formattedDateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, formattedJoiningDate, status, bankId, accountNumber, paymentModeId, customerId || null, projectId || null,
      emergencyContactName || null, emergencyContactNumber || null, emergencyContactRelation || null, personalEmail || null, alternateNumber || null, maritalStatus || 'SINGLE', bloodGroup || null
    ];
    console.log('Insert parameters:', insertData);

    const [result]: any = await pool.query(
      'INSERT INTO hrms_employees (employee_id, first_name, middle_name, last_name, gender, date_of_birth, mobile, email, work_email, address, city, state, pincode, photo_path, manpower_type_id, department_id, designation_id, work_location_id, shift_id, joining_date, status, bank_id, account_number, payment_mode_id, customer_id, project_id, emergency_contact_name, emergency_contact_number, emergency_contact_relation, personal_email, alternate_number, marital_status, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      insertData
    );
    console.log('Insert result:', result);
    const newEmployeeId = result.insertId;

    // Handle qualifications if provided
    if (qualificationIds && Array.isArray(qualificationIds) && qualificationIds.length > 0) {
      console.log('Saving qualifications for new employee:', qualificationIds);
      const qualificationValues = qualificationIds.map((qId: number) => [newEmployeeId, qId]);
      await pool.query(
        'INSERT INTO hrms_employee_qualifications (employee_id, qualification_id) VALUES ?',
        [qualificationValues]
      );
    }

    res.status(201).json({ success: true, message: 'Employee created successfully', id: newEmployeeId });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    console.error('Request Body:', req.body);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: `Failed to save data. A foreign key constraint failed. Please check the values for fields like department_id, designation_id, etc.`,
        error: error.sqlMessage
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. An employee with this information already exists.'
      });
    }

    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    employeeId, firstName, middleName, lastName, gender, dateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate, status = 'ACTIVE', bankId, accountNumber, paymentModeId, qualificationIds, customerId, projectId,
    emergencyContactName, emergencyContactNumber, emergencyContactRelation, personalEmail, alternateNumber, maritalStatus, bloodGroup
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !dateOfBirth || !mobile || !manpowerTypeId || !departmentId || !designationId || !workLocationId || !shiftId || !joiningDate) {
    return res.status(400).json({
      success: false,
      message: 'Required fields are missing: firstName, lastName, dateOfBirth, mobile, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate'
    });
  }

  // Validate foreign key values are valid numbers and not zero
  const requiredIds = { manpowerTypeId, departmentId, designationId, workLocationId, shiftId };
  for (const [field, value] of Object.entries(requiredIds)) {
    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
      return res.status(400).json({
        success: false,
        message: `${field} must be a valid positive integer`
      });
    }
  }

  // Validate optional foreign keys if provided
  if (bankId && (!Number.isInteger(Number(bankId)) || Number(bankId) <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'bankId must be a valid positive integer'
    });
  }

  if (paymentModeId && (!Number.isInteger(Number(paymentModeId)) || Number(paymentModeId) <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'paymentModeId must be a valid positive integer'
    });
  }

  try {
    // Verify foreign key constraints exist
    const [manpowerResult] = await pool.query('SELECT id FROM hrms_manpower_types WHERE id = ?', [manpowerTypeId]);
    const [departmentResult] = await pool.query('SELECT id FROM hrms_departments WHERE id = ?', [departmentId]);
    const [designationResult] = await pool.query('SELECT id FROM hrms_designations WHERE id = ?', [designationId]);
    const [workLocationResult] = await pool.query('SELECT id FROM hrms_work_locations WHERE id = ?', [workLocationId]);
    const [shiftResult] = await pool.query('SELECT id FROM hrms_shifts WHERE id = ?', [shiftId]);

    // Check if any foreign key references don't exist
    const missingRefs = [];
    if ((manpowerResult as any[]).length === 0) missingRefs.push('manpowerTypeId');
    if ((departmentResult as any[]).length === 0) missingRefs.push('departmentId');
    if ((designationResult as any[]).length === 0) missingRefs.push('designationId');
    if ((workLocationResult as any[]).length === 0) missingRefs.push('workLocationId');
    if ((shiftResult as any[]).length === 0) missingRefs.push('shiftId');

    if (missingRefs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid foreign key references: ${missingRefs.join(', ')}. Please ensure these master data records exist.`
      });
    }

    // Format dates for MySQL
    const formattedDateOfBirth = formatDateForMySQL(dateOfBirth);
    const formattedJoiningDate = formatDateForMySQL(joiningDate);

    const updateData = [
      employeeId, firstName, middleName, lastName, gender, formattedDateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, formattedJoiningDate, status, bankId, accountNumber, paymentModeId, customerId || null, projectId || null,
      emergencyContactName || null, emergencyContactNumber || null, emergencyContactRelation || null, personalEmail || null, alternateNumber || null, maritalStatus || 'SINGLE', bloodGroup || null,
      id
    ];

    const [result]: any = await pool.query(
      'UPDATE hrms_employees SET employee_id = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ?, date_of_birth = ?, mobile = ?, email = ?, work_email = ?, address = ?, city = ?, state = ?, pincode = ?, photo_path = ?, manpower_type_id = ?, department_id = ?, designation_id = ?, work_location_id = ?, shift_id = ?, joining_date = ?, status = ?, bank_id = ?, account_number = ?, payment_mode_id = ?, customer_id = ?, project_id = ?, emergency_contact_name = ?, emergency_contact_number = ?, emergency_contact_relation = ?, personal_email = ?, alternate_number = ?, marital_status = ?, blood_group = ? WHERE id = ?',
      updateData
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Handle qualifications - delete old ones and insert new ones
    if (qualificationIds && Array.isArray(qualificationIds)) {
      // Delete existing qualifications
      await pool.query('DELETE FROM hrms_employee_qualifications WHERE employee_id = ?', [id]);

      // Insert new qualifications
      if (qualificationIds.length > 0) {
        const qualificationValues = qualificationIds.map((qId: number) => [id, qId]);
        await pool.query(
          'INSERT INTO hrms_employee_qualifications (employee_id, qualification_id) VALUES ?',
          [qualificationValues]
        );
      }
    }

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    console.error('Request Body:', req.body);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: `Failed to save data. A foreign key constraint failed. Please check the values for fields like department_id, designation_id, etc.`,
        error: error.sqlMessage
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. An employee with this information already exists.'
      });
    }

    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_employees WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const uploadEmployeeDocument = async (req: Request, res: Response) => {
  console.log('📤 Upload request received');
  console.log('📤 req.body:', req.body);
  console.log('📤 req.file:', req.file);

  const { employeeId, documentTypeId, reference } = req.body;
  const buffer = req.file?.buffer;
  const fileName = req.file?.originalname;

  console.log('📤 Extracted values:', { employeeId, documentTypeId, reference, fileName, hasBuffer: !!buffer });

  if (!employeeId || !documentTypeId || !buffer || !fileName) {
    console.log('❌ Validation failed - missing required fields');
    return res.status(400).json({ success: false, message: 'Employee ID, Document Type ID, and file are required' });
  }

  try {
    const { uploadBufferToBlob, getBlobUrl } = require('../services/azureBlobService');

    // Upload to Azure blob storage in "documents" folder
    const blobName = await uploadBufferToBlob(buffer, fileName, 'documents/');
    const webPath = getBlobUrl(blobName); // Store public URL

    console.log('📤 File uploaded to Azure Blob:', { blobName, webPath });
    console.log('📤 Inserting into database:', { employeeId, documentTypeId, webPath, fileName, reference });

    const [result] = await pool.query(
      'INSERT INTO hrms_employee_documents (employee_id, document_type_id, file_path, file_name, reference) VALUES (?, ?, ?, ?, ?)',
      [employeeId, documentTypeId, webPath, fileName, reference]
    );

    console.log('✅ Document inserted successfully:', result);
    res.status(201).json({ success: true, message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

export const getEmployeeDocuments = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(`
      SELECT
        ed.id,
        ed.employee_id AS employeeId,
        ed.document_type_id AS documentTypeId,
        dt.name AS documentTypeName,
        ed.file_path AS filePath,
        ed.file_name AS fileName,
        ed.reference,
        ed.uploaded_at AS uploadedAt
      FROM hrms_employee_documents ed
      LEFT JOIN hrms_document_types dt ON ed.document_type_id = dt.id
      WHERE ed.employee_id = ?
      ORDER BY ed.uploaded_at DESC
    `, [id]);

    res.json({ success: true, message: 'Employee documents fetched successfully', data: rows });
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteEmployeeDocument = async (req: Request, res: Response) => {
  const { documentId } = req.params;

  try {
    const [result]: any = await pool.query('DELETE FROM hrms_employee_documents WHERE id = ?', [documentId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee document:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEmployeeWithPhoto = async (req: Request, res: Response) => {
  console.log('=== CREATE EMPLOYEE WITH PHOTO REQUEST START ===');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Request File:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'No file uploaded');

  let {
    employeeId, firstName, middleName, lastName, gender, dateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate, status = 'ACTIVE', bankId, accountNumber, paymentModeId, customerId, projectId,
    emergencyContactName, emergencyContactNumber, emergencyContactRelation, personalEmail, alternateNumber, maritalStatus, bloodGroup
  } = req.body;

  // Auto-generate employee ID if not provided
  if (!employeeId) {
    employeeId = await generateEmployeeId();
    console.log('Auto-generated employee ID:', employeeId);
  }

  console.log('Extracted fields:', {
    employeeId, firstName, middleName, lastName, gender, dateOfBirth, mobile, email, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate, status, bankId, accountNumber, paymentModeId
  });

  // Validate required fields
  const requiredFields = { firstName, lastName, dateOfBirth, mobile, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate };
  const missingFields = Object.entries(requiredFields).filter(([key, value]) => !value).map(([key]) => key);

  if (missingFields.length > 0) {
    console.log('Validation failed: Required fields missing:', missingFields);
    return res.status(400).json({
      success: false,
      message: `Required fields are missing: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  // Validate foreign key values are valid numbers and not zero
  const requiredIds = { manpowerTypeId, departmentId, designationId, workLocationId, shiftId };
  const invalidIds = [];
  for (const [field, value] of Object.entries(requiredIds)) {
    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
      invalidIds.push(field);
    }
  }

  if (invalidIds.length > 0) {
    console.log('Validation failed: Invalid foreign key IDs:', invalidIds);
    return res.status(400).json({
      success: false,
      message: `Invalid foreign key IDs: ${invalidIds.join(', ')}. All IDs must be positive integers.`,
      invalidIds
    });
  }

  // Validate optional foreign keys if provided
  if (bankId && (!Number.isInteger(Number(bankId)) || Number(bankId) <= 0)) {
    console.log('Validation failed: Invalid bankId:', bankId);
    return res.status(400).json({
      success: false,
      message: 'bankId must be a valid positive integer'
    });
  }

  if (paymentModeId && (!Number.isInteger(Number(paymentModeId)) || Number(paymentModeId) <= 0)) {
    console.log('Validation failed: Invalid paymentModeId:', paymentModeId);
    return res.status(400).json({
      success: false,
      message: 'paymentModeId must be a valid positive integer'
    });
  }

  try {
    console.log('=== FOREIGN KEY VALIDATION START ===');
    // Verify foreign key constraints exist
    console.log('Validating foreign keys...');
    const [manpowerResult] = await pool.query('SELECT id FROM hrms_manpower_types WHERE id = ?', [manpowerTypeId]);
    const [departmentResult] = await pool.query('SELECT id FROM hrms_departments WHERE id = ?', [departmentId]);
    const [designationResult] = await pool.query('SELECT id FROM hrms_designations WHERE id = ?', [designationId]);
    const [workLocationResult] = await pool.query('SELECT id FROM hrms_work_locations WHERE id = ?', [workLocationId]);
    const [shiftResult] = await pool.query('SELECT id FROM hrms_shifts WHERE id = ?', [shiftId]);

    console.log('Foreign key validation results:', {
      manpowerTypeId: { value: manpowerTypeId, found: (manpowerResult as any[]).length > 0 },
      departmentId: { value: departmentId, found: (departmentResult as any[]).length > 0 },
      designationId: { value: designationId, found: (designationResult as any[]).length > 0 },
      workLocationId: { value: workLocationId, found: (workLocationResult as any[]).length > 0 },
      shiftId: { value: shiftId, found: (shiftResult as any[]).length > 0 }
    });

    // Check if any foreign key references don't exist
    const missingRefs = [];
    if ((manpowerResult as any[]).length === 0) missingRefs.push('manpowerTypeId');
    if ((departmentResult as any[]).length === 0) missingRefs.push('departmentId');
    if ((designationResult as any[]).length === 0) missingRefs.push('designationId');
    if ((workLocationResult as any[]).length === 0) missingRefs.push('workLocationId');
    if ((shiftResult as any[]).length === 0) missingRefs.push('shiftId');

    if (missingRefs.length > 0) {
      console.log('Foreign key validation failed:', missingRefs);
      return res.status(400).json({
        success: false,
        message: `Invalid foreign key references: ${missingRefs.join(', ')}. Please ensure these master data records exist.`,
        missingRefs
      });
    }
    console.log('=== FOREIGN KEY VALIDATION PASSED ===');

    console.log('=== PHOTO UPLOAD HANDLING START ===');
    // Handle photo upload if provided
    let photoFileName = null;
    if (req.file) {
      try {
        const { uploadBufferToBlob, getBlobUrl } = require('../services/azureBlobService');
        const fileName = req.file.originalname;
        
        console.log('Uploading photo to Azure Blob Storage...');
        const blobName = await uploadBufferToBlob(req.file.buffer, fileName, 'photos/');
        photoFileName = getBlobUrl(blobName);
        console.log('Photo saved successfully to Azure:', photoFileName);
      } catch (photoError: any) {
        console.error('=== PHOTO UPLOAD ERROR ===');
        console.error('Photo upload failed:', photoError);
        return res.status(500).json({
          success: false,
          message: 'Failed to save employee photo. Please try again.',
          error: photoError.message
        });
      }
    } else {
      console.log('No photo file provided');
    }
    console.log('=== PHOTO UPLOAD HANDLING COMPLETED ===');

    // Format dates for MySQL
    const formattedDateOfBirth = formatDateForMySQL(dateOfBirth);
    const formattedJoiningDate = formatDateForMySQL(joiningDate);

    console.log('=== DATABASE INSERTION START ===');
    const insertData = [
      employeeId, firstName, middleName, lastName, gender, formattedDateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoFileName || photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, formattedJoiningDate, status, bankId, accountNumber, paymentModeId, customerId || null, projectId || null,
      emergencyContactName || null, emergencyContactNumber || null, emergencyContactRelation || null, personalEmail || null, alternateNumber || null, maritalStatus || 'SINGLE', bloodGroup || null
    ];
    console.log('Insert parameters:', insertData);

    const [result]: any = await pool.query(
      'INSERT INTO hrms_employees (employee_id, first_name, middle_name, last_name, gender, date_of_birth, mobile, email, work_email, address, city, state, pincode, photo_path, manpower_type_id, department_id, designation_id, work_location_id, shift_id, joining_date, status, bank_id, account_number, payment_mode_id, customer_id, project_id, emergency_contact_name, emergency_contact_number, emergency_contact_relation, personal_email, alternate_number, marital_status, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      insertData
    );
    console.log('=== DATABASE INSERTION SUCCESSFUL ===');
    console.log('Insert result:', result);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      id: result.insertId,
      photoPath: photoFileName
    });
  } catch (error: any) {
    console.error('=== CREATE EMPLOYEE WITH PHOTO ERROR ===');
    console.error('Error details:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL Message:', error.sqlMessage);
    console.error('Request Body:', req.body);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.error('Foreign key constraint violation');
      return res.status(400).json({
        success: false,
        message: `Failed to save data. A foreign key constraint failed. Please check the values for fields like department_id, designation_id, etc.`,
        error: error.sqlMessage,
        sqlError: error.sqlMessage
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entry error');
      const duplicateField = error.sqlMessage?.includes('employee_id') ? 'Employee ID' :
        error.sqlMessage?.includes('email') ? 'Email' : 'Unknown field';
      return res.status(400).json({
        success: false,
        message: `Duplicate entry. An employee with this ${duplicateField} already exists.`,
        duplicateField,
        error: error.sqlMessage
      });
    }

    if (error.code === 'ER_BAD_NULL_ERROR') {
      console.error('NULL constraint violation');
      return res.status(400).json({
        success: false,
        message: 'Required field cannot be null. Please check all required fields.',
        error: error.sqlMessage
      });
    }

    console.error('=== UNHANDLED ERROR ===');
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while saving employee',
      error: error.message,
      errorCode: error.code
    });
  }
};

export const updateEmployeeWithPhoto = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    employeeId, firstName, middleName, lastName, gender, dateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoPath, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate, status = 'ACTIVE', bankId, accountNumber, paymentModeId, qualificationIds, customerId, projectId,
    emergencyContactName, emergencyContactNumber, emergencyContactRelation, personalEmail, alternateNumber, maritalStatus, bloodGroup
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !dateOfBirth || !mobile || !manpowerTypeId || !departmentId || !designationId || !workLocationId || !shiftId || !joiningDate) {
    return res.status(400).json({
      success: false,
      message: 'Required fields are missing: firstName, lastName, dateOfBirth, mobile, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, joiningDate'
    });
  }

  // Validate foreign key values are valid numbers and not zero
  const requiredIds = { manpowerTypeId, departmentId, designationId, workLocationId, shiftId };
  for (const [field, value] of Object.entries(requiredIds)) {
    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
      return res.status(400).json({
        success: false,
        message: `${field} must be a valid positive integer`
      });
    }
  }

  // Validate optional foreign keys if provided
  if (bankId && (!Number.isInteger(Number(bankId)) || Number(bankId) <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'bankId must be a valid positive integer'
    });
  }

  if (paymentModeId && (!Number.isInteger(Number(paymentModeId)) || Number(paymentModeId) <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'paymentModeId must be a valid positive integer'
    });
  }

  try {
    // Verify foreign key constraints exist
    const [manpowerResult] = await pool.query('SELECT id FROM hrms_manpower_types WHERE id = ?', [manpowerTypeId]);
    const [departmentResult] = await pool.query('SELECT id FROM hrms_departments WHERE id = ?', [departmentId]);
    const [designationResult] = await pool.query('SELECT id FROM hrms_designations WHERE id = ?', [designationId]);
    const [workLocationResult] = await pool.query('SELECT id FROM hrms_work_locations WHERE id = ?', [workLocationId]);
    const [shiftResult] = await pool.query('SELECT id FROM hrms_shifts WHERE id = ?', [shiftId]);

    // Check if any foreign key references don't exist
    const missingRefs = [];
    if ((manpowerResult as any[]).length === 0) missingRefs.push('manpowerTypeId');
    if ((departmentResult as any[]).length === 0) missingRefs.push('departmentId');
    if ((designationResult as any[]).length === 0) missingRefs.push('designationId');
    if ((workLocationResult as any[]).length === 0) missingRefs.push('workLocationId');
    if ((shiftResult as any[]).length === 0) missingRefs.push('shiftId');

    if (missingRefs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid foreign key references: ${missingRefs.join(', ')}. Please ensure these master data records exist.`
      });
    }

    // Handle photo upload if provided
    let photoFileName = photoPath;
    if (req.file) {
      try {
        const { uploadBufferToBlob, getBlobUrl } = require('../services/azureBlobService');
        const fileName = req.file.originalname;

        const blobName = await uploadBufferToBlob(req.file.buffer, fileName, 'photos/');
        photoFileName = getBlobUrl(blobName);
      } catch (photoError: any) {
        return res.status(500).json({
          success: false,
          message: 'Failed to save employee photo',
          error: photoError.message
        });
      }
    }

    // Format dates for MySQL
    const formattedDateOfBirth = formatDateForMySQL(dateOfBirth);
    const formattedJoiningDate = formatDateForMySQL(joiningDate);

    const updateData = [
      employeeId, firstName, middleName, lastName, gender, formattedDateOfBirth, mobile, email, workEmail, address, city, state, pincode, photoFileName, manpowerTypeId, departmentId, designationId, workLocationId, shiftId, formattedJoiningDate, status, bankId, accountNumber, paymentModeId, customerId || null, projectId || null,
      emergencyContactName || null, emergencyContactNumber || null, emergencyContactRelation || null, personalEmail || null, alternateNumber || null, maritalStatus || 'SINGLE', bloodGroup || null,
      id
    ];

    const [result]: any = await pool.query(
      'UPDATE hrms_employees SET employee_id = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ?, date_of_birth = ?, mobile = ?, email = ?, work_email = ?, address = ?, city = ?, state = ?, pincode = ?, photo_path = ?, manpower_type_id = ?, department_id = ?, designation_id = ?, work_location_id = ?, shift_id = ?, joining_date = ?, status = ?, bank_id = ?, account_number = ?, payment_mode_id = ?, customer_id = ?, project_id = ?, emergency_contact_name = ?, emergency_contact_number = ?, emergency_contact_relation = ?, personal_email = ?, alternate_number = ?, marital_status = ?, blood_group = ? WHERE id = ?',
      updateData
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Handle qualifications - delete old ones and insert new ones
    if (qualificationIds && Array.isArray(qualificationIds)) {
      // Delete existing qualifications
      await pool.query('DELETE FROM hrms_employee_qualifications WHERE employee_id = ?', [id]);

      // Insert new qualifications
      if (qualificationIds.length > 0) {
        const qualificationValues = qualificationIds.map((qId: number) => [id, qId]);
        await pool.query(
          'INSERT INTO hrms_employee_qualifications (employee_id, qualification_id) VALUES ?',
          [qualificationValues]
        );
      }
    }

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error: any) {
    console.error('Error updating employee with photo:', error);
    console.error('Request Body:', req.body);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: `Failed to save data. A foreign key constraint failed. Please check the values for fields like department_id, designation_id, etc.`,
        error: error.sqlMessage
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. An employee with this information already exists.'
      });
    }

    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const searchEmployees = async (req: Request, res: Response) => {
  try {
    const { name, status, departmentId, page = 0, limit = 10 } = req.query;

    let whereClauses: string[] = [];
    let params: (string | number)[] = [];

    if (name) {
      whereClauses.push('(e.first_name LIKE ? OR e.middle_name LIKE ? OR e.last_name LIKE ?)');
      params.push(`%${name}%`, `%${name}%`, `%${name}%`);
    }
    if (status) {
      whereClauses.push('e.status = ?');
      params.push(status as string);
    }
    if (departmentId) {
      whereClauses.push('e.department_id = ?');
      params.push(departmentId as string);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM hrms_employees e ${whereSql}`;
    const [countRows]: any = await pool.query(countSql, params);
    const totalElements = countRows[0].total;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = pageNum * limitNum;

    // JOIN with departments and designations to get names
    const sql = `
      SELECT
        e.*,
        d.name as department_name,
        des.name as designation_name
      FROM hrms_employees e
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      LEFT JOIN hrms_designations des ON e.designation_id = des.id
      ${whereSql}
      LIMIT ? OFFSET ?
    `;
    const [rows]: any = await pool.query(sql, [...params, limitNum, offset]);
    const camelCaseRows = convertRowsToCamelCase(rows);

    res.json({
      success: true,
      message: 'Employees fetched successfully',
      data: {
        content: camelCaseRows,
        totalElements,
      },
    });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
