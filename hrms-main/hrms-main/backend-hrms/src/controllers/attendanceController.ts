
import { Request, Response } from 'express';
import pool from '../db';
import { AuthUser } from '../middleware/auth';

// ============================================================================
// IST TIMEZONE HANDLING UTILITIES
// All attendance timestamps MUST use IST (Asia/Kolkata, UTC+5:30)
// ============================================================================
const IST_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_HOURS = 5.5; // UTC+5:30

// Formatter for date in YYYY-MM-DD format (IST)
const formatISTDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

// Formatter for time in HH:MM:SS format (IST)
const formatISTTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST_TIMEZONE,
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

// Formatter for full datetime in IST
const formatISTDateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

/**
 * Get current date and time in IST timezone
 * This is the SINGLE SOURCE OF TRUTH for attendance timestamps
 */
function getISTDateTime() {
  const now = new Date();
  const date = formatISTDate.format(now); // YYYY-MM-DD in IST
  const time = formatISTTime.format(now); // HH:MM:SS in IST
  const fullDateTime = formatISTDateTime.format(now);
  const istIso = `${date}T${time}+05:30`;

  console.log(`[TIMEZONE DEBUG] getISTDateTime() called:`);
  console.log(`  - Server UTC time: ${now.toISOString()}`);
  console.log(`  - IST Date: ${date}`);
  console.log(`  - IST Time: ${time}`);
  console.log(`  - IST Full: ${fullDateTime}`);
  console.log(`  - IST ISO: ${istIso}`);

  return { date, time, istIso, fullDateTime, serverUtc: now.toISOString() };
}

/**
 * Safely format a date value to YYYY-MM-DD string in IST
 * Handles Date objects, ISO strings, and plain date strings
 * CRITICAL: Prevents UTC conversion issues
 */
function formatDateToISTString(dateValue: any): string {
  if (!dateValue) return '';

  // If already in YYYY-MM-DD format, return as-is
  if (typeof dateValue === 'string') {
    // Check if it's already a clean date string
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // If it's an ISO string with time component, extract date in IST
    if (dateValue.includes('T')) {
      const d = new Date(dateValue);
      return formatISTDate.format(d);
    }
    // Try parsing as date string
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return formatISTDate.format(d);
    }
    return dateValue; // Return as-is if can't parse
  }

  // If it's a Date object, format in IST
  if (dateValue instanceof Date) {
    return formatISTDate.format(dateValue);
  }

  return String(dateValue);
}

/**
 * Process attendance record rows to ensure dates are in YYYY-MM-DD format
 * This prevents timezone conversion issues when sending to frontend
 */
function processAttendanceRows(rows: any[]): any[] {
  return rows.map(row => {
    const processedRow = { ...row };

    // Process date field - ensure it's a plain YYYY-MM-DD string
    if (processedRow.date !== undefined) {
      const originalDate = processedRow.date;
      processedRow.date = formatDateToISTString(processedRow.date);
      console.log(`[TIMEZONE DEBUG] Row date processing: original=${originalDate} => processed=${processedRow.date}`);
    }

    return processedRow;
  });
}

export const getAllAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT 
        id, employee_id, 
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        check_in_time, check_out_time, total_hours, status, remarks,
        location_latitude, location_longitude, location_address, location_accuracy,
        biometric_fingerprint_id, biometric_face_id, biometric_confidence,
        device_id, device_ip_address, device_user_agent,
        work_location_type, is_manual_entry, approved_by,
        created_at, updated_at
      FROM hrms_attendance_records`
    );
    
    // Additional safety: Ensure date is formatted correctly
    const formattedRows = rows.map((row: any) => {
      if (row.date instanceof Date) {
        const istDate = new Intl.DateTimeFormat('en-CA', { 
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(row.date));
        row.date = istDate;
      } else if (typeof row.date === 'string' && row.date.includes('T')) {
        row.date = row.date.split('T')[0];
      }
      return row;
    });
    
    res.json({ success: true, message: "Attendance Records fetched successfully", data: formattedRows });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAttendanceRecordById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(
      `SELECT 
        id, employee_id, 
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        check_in_time, check_out_time, total_hours, status, remarks,
        location_latitude, location_longitude, location_address, location_accuracy,
        biometric_fingerprint_id, biometric_face_id, biometric_confidence,
        device_id, device_ip_address, device_user_agent,
        work_location_type, is_manual_entry, approved_by,
        created_at, updated_at
      FROM hrms_attendance_records WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance Record not found' });
    }
    
    // Format date if needed
    const record = rows[0];
    if (record.date instanceof Date) {
      const istDate = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(record.date));
      record.date = istDate;
    } else if (typeof record.date === 'string' && record.date.includes('T')) {
      record.date = record.date.split('T')[0];
    }
    
    res.json({ success: true, message: "Attendance Record fetched successfully", data: record });
  } catch (error) {
    console.error('Error fetching attendance record by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Smart mark: toggles between clock-in and clock-out for today's record
export const markAttendance = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  let employeeId = user.employeeId || 1; // Fallback to employee 1 for demo/admin users

  const { date: today, time: currentTime, istIso } = getISTDateTime();
  const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress || '');
  const ua = req.headers['user-agent'] || '';
  const { latitude, longitude, accuracy } = (req.body || {}) as any;

  try {
    console.log(`[markAttendance] employeeId=${employeeId}, date=${today}, time=${currentTime}, ist=${istIso}`);
    
    const [existing]: any = await pool.query(
      'SELECT id, check_in_time, check_out_time FROM hrms_attendance_records WHERE employee_id = ? AND date = ? LIMIT 1',
      [employeeId, today]
    );
    if (!existing.length) {
      const [result]: any = await pool.query(
        'INSERT INTO hrms_attendance_records (employee_id, date, check_in_time, status, work_location_type, is_manual_entry, device_ip_address, device_user_agent, location_latitude, location_longitude, location_accuracy) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)',
        [employeeId, today, currentTime, 'PRESENT', 'OFFICE', ip, ua, latitude ?? null, longitude ?? null, accuracy ?? null]
      );
      try {
        await logAudit(user, 'CREATE', 'hrms_attendance_records', String(result.insertId), { method: 'mark', action: 'CLOCK_IN' });
      } catch (auditError) {
        console.warn('Audit log failed, continuing:', auditError);
      }
      return res.json({ success: true, message: 'Clock-in recorded', id: result.insertId, action: 'CLOCK_IN' });
    }
    const rec = existing[0];
    if (!rec.check_out_time) {
      await pool.query(
        'UPDATE hrms_attendance_records SET check_out_time = ?, device_ip_address = ?, device_user_agent = ?, location_latitude = IFNULL(?, location_latitude), location_longitude = IFNULL(?, location_longitude), location_accuracy = IFNULL(?, location_accuracy) WHERE id = ?',
        [currentTime, ip, ua, latitude ?? null, longitude ?? null, accuracy ?? null, rec.id]
      );
      try {
        await logAudit(user, 'UPDATE', 'hrms_attendance_records', String(rec.id), { method: 'mark', action: 'CLOCK_OUT' });
      } catch (auditError) {
        console.warn('Audit log failed, continuing:', auditError);
      }
      return res.json({ success: true, message: 'Clock-out recorded', id: rec.id, action: 'CLOCK_OUT' });
    }
    return res.status(409).json({ success: false, message: 'Already clocked out for today' });
  } catch (error: any) {
    console.error('Error mark attendance:', error);
    const errorMsg = error?.sqlMessage || error?.message || 'Unknown error';
    return res.status(500).json({ 
      success: false, 
      message: `Internal server error: ${errorMsg}`,
      error: errorMsg 
    });
  }
};

export const createAttendanceRecord = async (req: Request, res: Response) => {
  const { employee_id, date, check_in_time, check_out_time, total_hours, status, remarks, location_latitude, location_longitude, location_address, location_accuracy, biometric_fingerprint_id, biometric_face_id, biometric_confidence, device_id, device_ip_address, device_user_agent, work_location_type, is_manual_entry, approved_by } = req.body;
  if (!employee_id || !date || !status || !work_location_type) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO hrms_attendance_records (employee_id, date, check_in_time, check_out_time, total_hours, status, remarks, location_latitude, location_longitude, location_address, location_accuracy, biometric_fingerprint_id, biometric_face_id, biometric_confidence, device_id, device_ip_address, device_user_agent, work_location_type, is_manual_entry, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [employee_id, date, check_in_time, check_out_time, total_hours, status, remarks, location_latitude, location_longitude, location_address, location_accuracy, biometric_fingerprint_id, biometric_face_id, biometric_confidence, device_id, device_ip_address, device_user_agent, work_location_type, is_manual_entry, approved_by]
    );
    res.status(201).json({ success: true, message: 'Attendance Record created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateAttendanceRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employee_id, date, check_in_time, check_out_time, total_hours, status, remarks, location_latitude, location_longitude, location_address, location_accuracy, biometric_fingerprint_id, biometric_face_id, biometric_confidence, device_id, device_ip_address, device_user_agent, work_location_type, is_manual_entry, approved_by } = req.body;
  if (!employee_id || !date || !status || !work_location_type) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query(
      'UPDATE hrms_attendance_records SET employee_id = ?, date = ?, check_in_time = ?, check_out_time = ?, total_hours = ?, status = ?, remarks = ?, location_latitude = ?, location_longitude = ?, location_address = ?, location_accuracy = ?, biometric_fingerprint_id = ?, biometric_face_id = ?, biometric_confidence = ?, device_id = ?, device_ip_address = ?, device_user_agent = ?, work_location_type = ?, is_manual_entry = ?, approved_by = ? WHERE id = ?',
      [employee_id, date, check_in_time, check_out_time, total_hours, status, remarks, location_latitude, location_longitude, location_address, location_accuracy, biometric_fingerprint_id, biometric_face_id, biometric_confidence, device_id, device_ip_address, device_user_agent, work_location_type, is_manual_entry, approved_by, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Attendance Record not found' });
    }
    res.json({ success: true, message: 'Attendance Record updated successfully' });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteAttendanceRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_attendance_records WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Attendance Record not found' });
    }
    res.json({ success: true, message: 'Attendance Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const autoClockIn = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  let employeeId = user.employeeId;

  console.log(`[autoClockIn] Starting for user: ${user.id}, username: ${user.username}, current employeeId: ${employeeId}`);

  // Use fallback employeeId if not set
  if (!employeeId) {
    employeeId = 1; // Fallback to employee 1 for demo/admin users
    console.log(`[autoClockIn] No employeeId found, using fallback: ${employeeId}`);
  }

  try {
    const { date: today, time: currentTime, istIso } = getISTDateTime();
    const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress || '');
    const ua = req.headers['user-agent'] || '';

    console.log(`Simple auto clock-in: employeeId=${employeeId}, date=${today}, time=${currentTime}, ist=${istIso}`);

    // Check if a record already exists for today
    const [existing]: any = await pool.query(
      'SELECT id, check_in_time, check_out_time FROM hrms_attendance_records WHERE employee_id = ? AND date = ? LIMIT 1',
      [employeeId, today]
    );

    if (existing.length > 0) {
      const rec = existing[0];
      if (rec.check_in_time && !rec.check_out_time) {
        // Already clocked in today, but not clocked out
        return res.status(409).json({
          success: false,
          message: 'You have already clocked in today. Please clock out first.',
          id: rec.id,
        });
      } else if (rec.check_in_time && rec.check_out_time) {
        // Already clocked in and out today
        return res.status(409).json({
          success: false,
          message: 'You have already completed attendance for today.',
          id: rec.id,
        });
      }
      // If record exists but no check_in_time, update it
      await pool.query(
        'UPDATE hrms_attendance_records SET check_in_time = ?, status = ?, work_location_type = ?, is_manual_entry = 0, device_ip_address = ?, device_user_agent = ? WHERE id = ?',
        [currentTime, 'PRESENT', 'OFFICE', ip, ua, rec.id]
      );
      try {
        await logAudit(user, 'UPDATE', 'hrms_attendance_records', String(rec.id), { method: 'auto-clock-in-simple' });
      } catch (auditError) {
        console.warn('Audit log failed, continuing:', auditError);
      }
      return res.json({
        success: true,
        message: 'Clock-in recorded',
        id: rec.id,
      });
    }

    // No existing record, create new one
    console.log(`[autoClockIn] Inserting new record: employee_id=${employeeId}, date=${today}, time=${currentTime}`);
    const [result]: any = await pool.query(
      'INSERT INTO hrms_attendance_records (employee_id, date, check_in_time, status, work_location_type, is_manual_entry, device_ip_address, device_user_agent) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
      [employeeId, today, currentTime, 'PRESENT', 'OFFICE', ip, ua]
    );

    // Verify the stored date matches what we intended to store
    const [verifyRows]: any = await pool.query(
      'SELECT DATE_FORMAT(date, "%Y-%m-%d") as stored_date FROM hrms_attendance_records WHERE id = ?',
      [result.insertId]
    );
    const storedDate = verifyRows[0]?.stored_date;
    console.log(`[autoClockIn] VERIFICATION: intended_date=${today}, stored_date=${storedDate}, match=${today === storedDate}`);

    if (today !== storedDate) {
      console.error(`[autoClockIn] DATE MISMATCH DETECTED! intended=${today}, stored=${storedDate}`);
    }

    try {
      await logAudit(user, 'CREATE', 'hrms_attendance_records', String(result.insertId), { method: 'auto-clock-in-simple' });
    } catch (auditError) {
      console.warn('Audit log failed, continuing:', auditError);
    }

    console.log(`[autoClockIn] SUCCESS: Record created with id=${result.insertId}, date=${today}`);
    return res.json({
      success: true,
      message: 'Clock-in recorded',
      id: result.insertId,
      date: today, // Include the date in response for frontend verification
    });
  } catch (error: any) {
    console.error('Error auto clock-in (simple):', error);
    const errorMsg = error?.sqlMessage || error?.message || 'Unknown error';
    return res.status(500).json({
      success: false,
      message: `Internal server error during clock-in: ${errorMsg}`,
      error: errorMsg,
    });
  }
};

// Auto Clock Out - similar to autoClockIn but for clocking out
export const autoClockOut = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  let employeeId = user.employeeId;

  console.log(`[autoClockOut] Starting for user: ${user.id}, username: ${user.username}, current employeeId: ${employeeId}`);

  // Use fallback employeeId if not set
  if (!employeeId) {
    employeeId = 1; // Fallback to employee 1 for demo/admin users
    console.log(`[autoClockOut] No employeeId found, using fallback: ${employeeId}`);
  }

  try {
    const { date: today, time: currentTime, istIso } = getISTDateTime();
    const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress || '');
    const ua = req.headers['user-agent'] || '';

    console.log(`Auto clock-out: employeeId=${employeeId}, date=${today}, time=${currentTime}, ist=${istIso}`);

    // Check if a record exists for today
    const [existing]: any = await pool.query(
      'SELECT id, check_in_time, check_out_time FROM hrms_attendance_records WHERE employee_id = ? AND date = ? LIMIT 1',
      [employeeId, today]
    );

    if (existing.length === 0) {
      // No record exists for today
      return res.status(404).json({
        success: false,
        message: 'No clock-in record found for today. Please clock in first.',
      });
    }

    const rec = existing[0];
    if (!rec.check_in_time) {
      // Record exists but no check-in time
      return res.status(400).json({
        success: false,
        message: 'You have not clocked in today. Please clock in first.',
        id: rec.id,
      });
    }

    if (rec.check_out_time) {
      // Already clocked out today
      return res.status(409).json({
        success: false,
        message: 'You have already clocked out for today.',
        id: rec.id,
      });
    }

    // Clock out - update the record with check_out_time
    await pool.query(
      'UPDATE hrms_attendance_records SET check_out_time = ?, device_ip_address = ?, device_user_agent = ? WHERE id = ?',
      [currentTime, ip, ua, rec.id]
    );

    try {
      await logAudit(user, 'UPDATE', 'hrms_attendance_records', String(rec.id), { method: 'auto-clock-out' });
    } catch (auditError) {
      console.warn('Audit log failed, continuing:', auditError);
    }

    return res.json({
      success: true,
      message: 'Clock-out recorded',
      id: rec.id,
      action: 'CLOCK_OUT',
    });
  } catch (error: any) {
    console.error('Error auto clock-out:', error);
    const errorMsg = error?.sqlMessage || error?.message || 'Unknown error';
    return res.status(500).json({
      success: false,
      message: `Internal server error during clock-out: ${errorMsg}`,
      error: errorMsg,
    });
  }
};

// GPS mark (alias): behaves as markAttendance but prefers GPS params
export const gpsMark = async (req: Request, res: Response) => {
  return markAttendance(req, res);
};

export const submitManualAttendance = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  let employeeId = user.employeeId;
  const { date, check_in_time, check_out_time, reason } = req.body;

  console.log(`[submitManualAttendance] Starting for user: ${user.id}, employeeId: ${employeeId}`);
  console.log(`[submitManualAttendance] Request data:`, { date, check_in_time, check_out_time, reason });

  if (!date || (!check_in_time && !check_out_time)) {
    return res.status(400).json({ success: false, message: 'Provide date and at least one time (check-in or check-out)' });
  }

  // Ensure employee exists
  try {
    if (employeeId) {
      const [empCheck]: any = await pool.query('SELECT id FROM hrms_employees WHERE id = ? LIMIT 1', [employeeId]);
      if (!empCheck.length) {
        console.log(`[submitManualAttendance] Employee ${employeeId} doesn't exist. Creating...`);
        employeeId = await ensureEmployeeForUser(user);
      }
    } else {
      console.log(`[submitManualAttendance] No employeeId. Creating employee...`);
      employeeId = await ensureEmployeeForUser(user);
    }
  } catch (error: any) {
    console.error('[submitManualAttendance] Failed to ensure employee:', error);
    return res.status(400).json({ 
      success: false, 
      message: `Failed to verify employee record: ${error?.message || 'Unknown error'}. Please contact administrator.` 
    });
  }

  // Format time values (ensure HH:MM:SS format)
  const formatTime = (time: string | null | undefined): string | null => {
    if (!time) return null;
    // If time is in HH:MM format, convert to HH:MM:SS
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`;
    }
    // If already in HH:MM:SS format, return as is
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time;
    }
    return time;
  };

  try {
    const formattedCheckIn = formatTime(check_in_time);
    const formattedCheckOut = formatTime(check_out_time);

    console.log(`[submitManualAttendance] Inserting manual attendance request for employee ${employeeId}`);
    const [result]: any = await pool.query(
      'INSERT INTO hrms_manual_attendance_requests (employee_id, date, check_in_time, check_out_time, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
      [employeeId, date, formattedCheckIn, formattedCheckOut, reason ?? null, 'PENDING']
    );
    
    await logAudit(user, 'CREATE', 'hrms_manual_attendance_requests', String(result.insertId), {});
    console.log(`[submitManualAttendance] Manual attendance request created with ID: ${result.insertId}`);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Manual attendance request submitted successfully', 
      id: result.insertId 
    });
  } catch (error: any) {
    console.error('[submitManualAttendance] Error:', {
      message: error?.message,
      sqlMessage: error?.sqlMessage,
      code: error?.code,
      stack: error?.stack
    });
    return res.status(500).json({ 
      success: false, 
      message: `Failed to submit manual attendance: ${error?.sqlMessage || error?.message || 'Unknown error'}`,
      error: error?.sqlMessage || error?.message
    });
  }
};

export const getMyAttendanceRecords = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  
  console.log(`[getMyAttendanceRecords] Starting for user: ${user.id}, username: ${user.username}, token employeeId: ${user.employeeId}`);

  try {
    // First, get the current employee_id from the users table (not from token)
    const [userRows]: any = await pool.query('SELECT employee_id FROM hrms_users WHERE id = ? LIMIT 1', [user.id]);
    let employeeId = userRows.length > 0 ? userRows[0].employee_id : user.employeeId;

    console.log(`[getMyAttendanceRecords] Employee ID from database: ${employeeId}, from token: ${user.employeeId}`);

    // Ensure employee exists
    if (employeeId) {
      const [empCheck]: any = await pool.query('SELECT id FROM hrms_employees WHERE id = ? LIMIT 1', [employeeId]);
      if (!empCheck.length) {
        console.log(`[getMyAttendanceRecords] Employee ${employeeId} doesn't exist. Creating...`);
        employeeId = await ensureEmployeeForUser(user);
        console.log(`[getMyAttendanceRecords] New employee created: ${employeeId}`);
      }
    } else {
      console.log(`[getMyAttendanceRecords] No employeeId found. Creating...`);
      employeeId = await ensureEmployeeForUser(user);
      console.log(`[getMyAttendanceRecords] New employee created: ${employeeId}`);
    }

    // Query attendance records
    // CRITICAL: Format date as YYYY-MM-DD string to avoid timezone conversion issues
    console.log(`[getMyAttendanceRecords] Querying attendance records for employee: ${employeeId}`);
    const [rows]: any = await pool.query(
      `SELECT 
        id, employee_id, 
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        check_in_time, check_out_time, total_hours, status, remarks,
        location_latitude, location_longitude, location_address, location_accuracy,
        biometric_fingerprint_id, biometric_face_id, biometric_confidence,
        device_id, device_ip_address, device_user_agent,
        work_location_type, is_manual_entry, approved_by,
        created_at, updated_at
      FROM hrms_attendance_records 
      WHERE employee_id = ? 
      ORDER BY date DESC, id DESC 
      LIMIT 500`,
      [employeeId]
    );
    
    console.log(`[getMyAttendanceRecords] Found ${rows.length} attendance records`);

    // Log first few records for debugging timezone issues
    if (rows.length > 0) {
      const sampleRows = rows.slice(0, 3);
      console.log(`[getMyAttendanceRecords] Sample raw dates from DB:`,
        sampleRows.map((r: any) => ({ id: r.id, date: r.date, dateType: typeof r.date, isDateObj: r.date instanceof Date }))
      );
    }

    // Additional safety: Ensure date is formatted correctly (in case DATE_FORMAT doesn't work)
    const formattedRows = rows.map((row: any, index: number) => {
      const originalDate = row.date;
      if (row.date instanceof Date) {
        // If still a Date object, format it as YYYY-MM-DD in IST
        const istDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(row.date));
        row.date = istDate;
        if (index < 3) {
          console.log(`[getMyAttendanceRecords] Date conversion (Date obj): ${originalDate} -> ${row.date}`);
        }
      } else if (typeof row.date === 'string' && row.date.includes('T')) {
        // If it's an ISO string, extract just the date part
        row.date = row.date.split('T')[0];
        if (index < 3) {
          console.log(`[getMyAttendanceRecords] Date conversion (ISO string): ${originalDate} -> ${row.date}`);
        }
      }
      return row;
    });

    // Log final dates being sent to frontend
    if (formattedRows.length > 0) {
      console.log(`[getMyAttendanceRecords] Final dates being sent to frontend:`,
        formattedRows.slice(0, 3).map((r: any) => ({ id: r.id, date: r.date }))
      );
    }

    return res.json({ success: true, data: formattedRows });
  } catch (error: any) {
    console.error('[getMyAttendanceRecords] Error:', {
      message: error?.message,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllAttendanceForManagers = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT 
        ar.id, ar.employee_id,
        DATE_FORMAT(ar.date, '%Y-%m-%d') as date,
        ar.check_in_time, ar.check_out_time, ar.total_hours, ar.status, ar.remarks,
        ar.location_latitude, ar.location_longitude, ar.location_address, ar.location_accuracy,
        ar.biometric_fingerprint_id, ar.biometric_face_id, ar.biometric_confidence,
        ar.device_id, ar.device_ip_address, ar.device_user_agent,
        ar.work_location_type, ar.is_manual_entry, ar.approved_by,
        ar.created_at, ar.updated_at,
        e.first_name, 
        e.last_name,
        e.employee_id,
        CASE 
          WHEN ar.date = CURDATE() AND ar.check_in_time IS NOT NULL AND ar.check_out_time IS NULL THEN 'CLOCKED_IN'
          WHEN ar.date = CURDATE() AND ar.check_in_time IS NOT NULL AND ar.check_out_time IS NOT NULL THEN 'CLOCKED_OUT'
          ELSE 'NOT_CLOCKED_IN'
        END as current_status
      FROM hrms_attendance_records ar 
      JOIN hrms_employees e ON e.id = ar.employee_id 
      ORDER BY ar.date DESC, ar.id DESC 
      LIMIT 1000`
    );
    
    // Format dates if needed
    const formattedRows = rows.map((row: any) => {
      if (row.date instanceof Date) {
        const istDate = new Intl.DateTimeFormat('en-CA', { 
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(row.date));
        row.date = istDate;
      } else if (typeof row.date === 'string' && row.date.includes('T')) {
        row.date = row.date.split('T')[0];
      }
      return row;
    });
    
    return res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const approveManualAttendance = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { requestId, approve, remark } = req.body;
  if (!requestId) return res.status(400).json({ success: false, message: 'requestId is required' });
  try {
    const status = approve ? 'APPROVED' : 'REJECTED';
    let employeeId = user.employeeId;
    if (!employeeId) {
      employeeId = await ensureEmployeeForUser(user);
    }
    // Update request
    await pool.query('UPDATE hrms_manual_attendance_requests SET status = ?, approved_by = ? WHERE id = ?', [
      status,
      employeeId,
      requestId
    ]);
    // If approved, create/update hrms_attendance record
    if (approve) {
      const [reqRows]: any = await pool.query('SELECT * FROM hrms_manual_attendance_requests WHERE id = ?', [requestId]);
      const reqRow = reqRows[0];
      const [existing]: any = await pool.query(
        'SELECT id FROM hrms_attendance_records WHERE employee_id = ? AND date = ?',
        [reqRow.employee_id, reqRow.date]
      );
      if (existing.length) {
        await pool.query(
          'UPDATE hrms_attendance_records SET check_in_time = IFNULL(?, check_in_time), check_out_time = IFNULL(?, check_out_time), is_manual_entry = 1, approved_by = ? WHERE id = ?',
          [reqRow.check_in_time, reqRow.check_out_time, user.username, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO hrms_attendance_records (employee_id, date, check_in_time, check_out_time, status, work_location_type, is_manual_entry, remarks, approved_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
          [reqRow.employee_id, reqRow.date, reqRow.check_in_time, reqRow.check_out_time, 'PRESENT', 'OFFICE', remark ?? null, user.username]
        );
      }
    }
    await logAudit(user, 'UPDATE', 'hrms_manual_attendance_requests', String(requestId), { status, remark });
    return res.json({ success: true, message: `Manual attendance ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Error approving manual attendance:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const requestRegularization = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  let employeeId = user.employeeId;
  const { attendance_id, requested_change, reason } = req.body;

  console.log(`[requestRegularization] Starting for user: ${user.id}, employeeId: ${employeeId}`);
  console.log(`[requestRegularization] Request data:`, { attendance_id, requested_change, reason });

  if (!attendance_id || !requested_change) {
    return res.status(400).json({ success: false, message: 'attendance_id and requested_change are required' });
  }

  // Ensure employee exists
  try {
    if (employeeId) {
      const [empCheck]: any = await pool.query('SELECT id FROM hrms_employees WHERE id = ? LIMIT 1', [employeeId]);
      if (!empCheck.length) {
        console.log(`[requestRegularization] Employee ${employeeId} doesn't exist. Creating...`);
        employeeId = await ensureEmployeeForUser(user);
      }
    } else {
      console.log(`[requestRegularization] No employeeId. Creating employee...`);
      employeeId = await ensureEmployeeForUser(user);
    }
  } catch (error: any) {
    console.error('[requestRegularization] Failed to ensure employee:', error);
    return res.status(400).json({ 
      success: false, 
      message: `Failed to verify employee record: ${error?.message || 'Unknown error'}. Please contact administrator.` 
    });
  }

  // Verify attendance record exists and belongs to the employee
  try {
    const [attCheck]: any = await pool.query(
      'SELECT id FROM hrms_attendance_records WHERE id = ? AND employee_id = ? LIMIT 1',
      [attendance_id, employeeId]
    );
    if (!attCheck.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attendance record not found or does not belong to you' 
      });
    }
  } catch (error: any) {
    console.error('[requestRegularization] Error verifying attendance record:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error verifying attendance record' 
    });
  }

  try {
    console.log(`[requestRegularization] Inserting regularization request for employee ${employeeId}`);
    const [result]: any = await pool.query(
      'INSERT INTO hrms_regularization_requests (employee_id, attendance_id, requested_change, reason, status) VALUES (?, ?, ?, ?, ?)',
      [employeeId, attendance_id, requested_change, reason ?? null, 'PENDING']
    );
    
    await logAudit(user, 'CREATE', 'hrms_regularization_requests', String(result.insertId), {});
    console.log(`[requestRegularization] Regularization request created with ID: ${result.insertId}`);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Regularization request submitted successfully', 
      id: result.insertId 
    });
  } catch (error: any) {
    console.error('[requestRegularization] Error:', {
      message: error?.message,
      sqlMessage: error?.sqlMessage,
      code: error?.code,
      stack: error?.stack
    });
    return res.status(500).json({ 
      success: false, 
      message: `Failed to submit regularization request: ${error?.sqlMessage || error?.message || 'Unknown error'}`,
      error: error?.sqlMessage || error?.message
    });
  }
};

export const getMyRegularizationStatus = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  let employeeId = user.employeeId;

  // Ensure employee exists
  try {
    if (employeeId) {
      const [empCheck]: any = await pool.query('SELECT id FROM hrms_employees WHERE id = ? LIMIT 1', [employeeId]);
      if (!empCheck.length) {
        employeeId = await ensureEmployeeForUser(user);
      }
    } else {
      employeeId = await ensureEmployeeForUser(user);
    }
  } catch (error: any) {
    console.error('[getMyRegularizationStatus] Failed to ensure employee:', error);
    // Return empty array if employee can't be created
    return res.json({ success: true, data: [] });
  }

  try {
    // Use DATE_FORMAT to ensure date is returned as YYYY-MM-DD string, not Date object
    const [rows]: any = await pool.query(
      `SELECT rr.*, DATE_FORMAT(ar.date, '%Y-%m-%d') as date
       FROM hrms_regularization_requests rr
       JOIN hrms_attendance_records ar ON ar.id = rr.attendance_id
       WHERE rr.employee_id = ?
       ORDER BY rr.id DESC LIMIT 500`,
      [employeeId]
    );
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('[getMyRegularizationStatus] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const approveRegularization = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { requestId, approve } = req.body;
  if (!requestId) return res.status(400).json({ success: false, message: 'requestId is required' });
  try {
    const status = approve ? 'APPROVED' : 'REJECTED';
    let employeeId = user.employeeId;
    if (!employeeId) {
      employeeId = await ensureEmployeeForUser(user);
    }
    await pool.query('UPDATE hrms_regularization_requests SET status = ?, approved_by = ? WHERE id = ?', [
      status,
      employeeId,
      requestId
    ]);
    if (approve) {
      const [reqRows]: any = await pool.query('SELECT * FROM hrms_regularization_requests WHERE id = ?', [requestId]);
      const rr = reqRows[0];
      // Very simple: apply requested_change as remarks for auditability
      await pool.query('UPDATE hrms_attendance_records SET remarks = ? WHERE id = ?', [rr.requested_change, rr.attendance_id]);
    }
    await logAudit(user, 'UPDATE', 'hrms_regularization_requests', String(requestId), { status });
    return res.json({ success: true, message: `Regularization ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Error approving regularization:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPendingManualRequests = async (req: Request, res: Response) => {
  try {
    // Use DATE_FORMAT to ensure date is returned as YYYY-MM-DD string, not Date object
    const [rows]: any = await pool.query(
      `SELECT r.id, r.employee_id, DATE_FORMAT(r.date, '%Y-%m-%d') as date,
              r.check_in_time, r.check_out_time, r.reason, r.status, r.approved_by,
              r.created_at, r.updated_at, e.first_name, e.last_name
       FROM hrms_manual_attendance_requests r
       JOIN hrms_employees e ON e.id = r.employee_id
       WHERE r.status = "PENDING"
       ORDER BY r.id DESC LIMIT 500`
    );

    console.log(`[getPendingManualRequests] Found ${rows.length} pending requests`);
    if (rows.length > 0) {
      console.log(`[getPendingManualRequests] Sample date format:`, rows[0]?.date, typeof rows[0]?.date);
    }

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching pending manual requests:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPendingRegularizationRequests = async (req: Request, res: Response) => {
  try {
    // Use DATE_FORMAT to ensure date is returned as YYYY-MM-DD string, not Date object
    const [rows]: any = await pool.query(
      `SELECT rr.*, e.first_name, e.last_name, DATE_FORMAT(ar.date, '%Y-%m-%d') as date
       FROM hrms_regularization_requests rr
       JOIN hrms_employees e ON e.id = rr.employee_id
       JOIN hrms_attendance_records ar ON ar.id = rr.attendance_id
       WHERE rr.status = "PENDING"
       ORDER BY rr.id DESC LIMIT 500`
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching pending regularization requests:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Admin generic approve for required API shape
export const adminApprove = async (req: Request, res: Response) => {
  const { type, requestId, approve, remark } = req.body || {};
  if (!type || !requestId) return res.status(400).json({ success: false, message: 'type and requestId required' });
  if (type === 'manual') {
    (req as any).body = { requestId, approve, remark };
    return approveManualAttendance(req, res);
  }
  if (type === 'regularization') {
    (req as any).body = { requestId, approve };
    return approveRegularization(req, res);
  }
  return res.status(400).json({ success: false, message: 'Unknown type' });
};

// Simple reports summary
export const getAttendanceReports = async (req: Request, res: Response) => {
  const { from, to, departmentId } = req.query as any;
  try {
    const where: string[] = [];
    const params: any[] = [];
    if (from) { where.push('ar.date >= ?'); params.push(from); }
    if (to) { where.push('ar.date <= ?'); params.push(to); }
    if (departmentId) { where.push('e.department_id = ?'); params.push(Number(departmentId)); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows]: any = await pool.query(
      `
        SELECT ar.employee_id, e.first_name, e.last_name,
               COUNT(*) AS days,
               SUM(TIMESTAMPDIFF(MINUTE, CONCAT(ar.date, ' ', IFNULL(ar.check_in_time,'00:00:00')), CONCAT(ar.date, ' ', IFNULL(ar.check_out_time, ar.check_in_time)))) AS total_minutes
        FROM hrms_attendance_records ar
        JOIN hrms_employees e ON e.id = ar.employee_id
        ${whereSql}
        GROUP BY ar.employee_id, e.first_name, e.last_name
        ORDER BY e.first_name, e.last_name
      `,
      params
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error building attendance report:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

async function logAudit(user: AuthUser, action: string, entity: string, entityId: string, details: any) {
  try {
    await pool.query(
      'INSERT INTO hrms_audit_logs (actor_id, actor_role, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.role, action, entity, entityId, JSON.stringify(details ?? {})]
    );
  } catch (e) {
    // best effort
    console.warn('Audit log failed', e);
  }
}

// Helpers to create a minimal employee and link current user if none exists
async function ensureEmployeeForUser(user: AuthUser): Promise<number> {
  try {
    // Ensure baseline master rows exist and get ids
    console.log('[ensureEmployeeForUser] Creating master data for employee...');
    const manpowerTypeId = await ensureSingleRow('hrms_manpower_types', 'name', 'General');
    const departmentId = await ensureSingleRow('hrms_departments', 'name', 'General');
    const designationId = await ensureSingleRow('hrms_designations', 'name', 'Associate', { department_id: departmentId });
    const workLocationId = await ensureSingleRow('hrms_work_locations', 'name', 'HQ', {
      code: 'HQ',
      city: 'N/A',
      state: 'N/A',
      pincode: '000000'
    });

    console.log(`[ensureEmployeeForUser] Master data IDs: manpowerType=${manpowerTypeId}, dept=${departmentId}, designation=${designationId}, location=${workLocationId}`);

    // Create employee
    const firstName = (user as any).fullName?.split(' ')[0] || user.username || 'User';
    const lastName = (user as any).fullName?.split(' ').slice(1).join(' ') || 'Demo';
    const employeeCode = `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userEmail = (user as any).email || `${user.username}@company.com`;
    
    console.log(`[ensureEmployeeForUser] Creating employee: ${firstName} ${lastName}, code: ${employeeCode}, email: ${userEmail}`);
    
    const [result]: any = await pool.query(
      `INSERT INTO hrms_employees
       (employee_id, first_name, middle_name, last_name, gender, date_of_birth, mobile, email, address, city, state, pincode,
        manpower_type_id, department_id, designation_id, work_location_id, shift_id, joining_date, status, bank_id, account_number, payment_mode_id, is_active)
       VALUES (?, ?, NULL, ?, 'OTHER', '1990-01-01', '0000000000', ?, NULL, 'N/A', 'N/A', '000000',
        ?, ?, ?, ?, NULL, CURDATE(), 'ACTIVE', NULL, NULL, NULL, 1)`,
      [
        employeeCode,
        firstName,
        lastName,
        userEmail,
        manpowerTypeId,
        departmentId,
        designationId,
        workLocationId
      ]
    );
    const empId = result.insertId;
    console.log(`[ensureEmployeeForUser] Employee created with ID: ${empId}`);
    
    // Verify employee was created
    const [verify]: any = await pool.query('SELECT id FROM hrms_employees WHERE id = ?', [empId]);
    if (!verify.length) {
      throw new Error(`Employee creation failed: Employee ID ${empId} not found after insert`);
    }
    
    // Update user's employee_id
    const [updateResult]: any = await pool.query('UPDATE hrms_users SET employee_id = ? WHERE id = ?', [empId, user.id]);
    console.log(`[ensureEmployeeForUser] User ${user.id} linked to employee ${empId}, rows affected: ${updateResult.affectedRows}`);
    
    // Verify user was updated
    const [userVerify]: any = await pool.query('SELECT employee_id FROM hrms_users WHERE id = ?', [user.id]);
    if (userVerify.length && userVerify[0].employee_id !== empId) {
      console.warn(`[ensureEmployeeForUser] Warning: User employee_id update may have failed. Expected ${empId}, got ${userVerify[0].employee_id}`);
    }
    
    return empId;
  } catch (error: any) {
    console.error('[ensureEmployeeForUser] Error details:', {
      message: error?.message,
      sqlMessage: error?.sqlMessage,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      stack: error?.stack
    });
    throw new Error(`Failed to create employee: ${error?.message || 'Unknown error'}${error?.sqlMessage ? ` (SQL: ${error.sqlMessage})` : ''}`);
  }
}

async function ensureSingleRow(table: string, col: string, value: string, extra?: Record<string, any>): Promise<number> {
  const [rows]: any = await pool.query(`SELECT id FROM ${table} WHERE ${col} = ? LIMIT 1`, [value]);
  if (rows.length) return rows[0].id;
  const keys = [col, ...(extra ? Object.keys(extra) : [])];
  const placeholders = keys.map(() => '?').join(', ');
  const params = [value, ...(extra ? Object.values(extra) : [])];
  const [res]: any = await pool.query(
    `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
    params
  );
  return res.insertId;
}
