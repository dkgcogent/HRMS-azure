
import { Request, Response } from 'express';
import pool from '../db';
import { convertRowsToCamelCase, convertRowToCamelCase, formatDateForDisplay } from '../utils/dataConversion';

export const getAllBirthdayReminders = async (req: Request, res: Response) => {
  try {
    // First, let's sync/refresh the birthday_reminders table from hrms_employees
    // Calculate birthdays for the next 30 days
    await pool.query(`
      INSERT INTO birthday_reminders (employee_id, birth_date, days_until_birthday)
      SELECT 
        id as employee_id, 
        date_of_birth as birth_date,
        DATEDIFF(
          STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(date_of_birth), '-', DAY(date_of_birth)), '%Y-%m-%d') + 
          INTERVAL (CASE WHEN STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(date_of_birth), '-', DAY(date_of_birth)), '%Y-%m-%d') < CURDATE() THEN 1 ELSE 0 END) YEAR,
          CURDATE()
        ) as days_until_birthday
      FROM hrms_employees
      WHERE status = 'ACTIVE'
      ON DUPLICATE KEY UPDATE 
        days_until_birthday = VALUES(days_until_birthday),
        birth_date = VALUES(birth_date)
    `);

    // Clean up old reminders (optional, but good for data hygiene)
    // For now, let's just fetch the upcoming ones
    const [rows]: any = await pool.query(`
      SELECT br.*, e.first_name, e.last_name, d.name as department,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM birthday_reminders br
      JOIN hrms_employees e ON br.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      WHERE br.days_until_birthday >= 0 AND br.days_until_birthday <= 30
      ORDER BY br.days_until_birthday ASC
    `);

    const camelCaseRows = convertRowsToCamelCase(rows);
    camelCaseRows.forEach((row: any) => {
      row.birthDate = formatDateForDisplay(row.birthDate);
      row.notificationSent = row.notificationSent === 1;
      row.managerNotified = row.managerNotified === 1;
    });

    res.json({ success: true, message: "Birthday Reminders fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching birthday reminders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBirthdayReminderById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(`
      SELECT br.*, e.first_name, e.last_name, d.name as department,
      CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name
      FROM birthday_reminders br
      JOIN hrms_employees e ON br.employee_id = e.id
      LEFT JOIN hrms_departments d ON e.department_id = d.id
      WHERE br.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Birthday Reminder not found' });
    }

    const camelCaseRow = convertRowToCamelCase(rows[0]);
    camelCaseRow.birthDate = formatDateForDisplay(camelCaseRow.birthDate);
    camelCaseRow.notificationSent = camelCaseRow.notificationSent === 1;
    camelCaseRow.managerNotified = camelCaseRow.managerNotified === 1;

    res.json({ success: true, message: "Birthday Reminder fetched successfully", data: camelCaseRow });
  } catch (error) {
    console.error('Error fetching birthday reminder by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createBirthdayReminder = async (req: Request, res: Response) => {
  const { employeeId, birthDate, daysUntilBirthday, notificationSent, managerNotified } = req.body;

  // If body is empty, it means trigger sending reminders for all upcoming birthdays
  if (!employeeId && Object.keys(req.body).length === 0) {
    try {
      // 1. Get settings
      const [settingsRows]: any = await pool.query('SELECT * FROM hrms_notification_settings WHERE id = 1');
      const settings = settingsRows[0] || { birthday_days_before: 1, birthday_enabled: 1 };

      if (!settings.birthday_enabled) {
        return res.json({ success: true, message: 'Birthday reminders are disabled in settings' });
      }

      // 2. Find employees with birthdays in the next 'settings.birthday_days_before' days
      const [upcomingBirthdays]: any = await pool.query(`
        SELECT br.*, e.first_name, e.last_name, e.email, d.name as department
        FROM birthday_reminders br
        JOIN hrms_employees e ON br.employee_id = e.id
        LEFT JOIN hrms_departments d ON e.department_id = d.id
        WHERE br.days_until_birthday <= ? AND br.days_until_birthday >= 0
        AND br.notification_sent = 0
      `, [settings.birthday_days_before]);

      if (upcomingBirthdays.length === 0) {
        return res.json({ success: true, message: 'No new birthday reminders to send today' });
      }

      // 3. Mark them as sent and create IN_APP bell notifications
      for (const birthday of upcomingBirthdays) {
        await pool.query(
          'UPDATE birthday_reminders SET notification_sent = 1, last_notified_at = NOW() WHERE id = ?',
          [birthday.id]
        );

        const subject = `🎂 Birthday Reminder: ${birthday.first_name} ${birthday.last_name}`;
        const content = `${birthday.first_name} ${birthday.last_name} from ${birthday.department || 'your team'} has a birthday ${birthday.days_until_birthday === 0 ? 'today' : `in ${birthday.days_until_birthday} day(s)`}! Don't forget to wish them!`;

        // Record EMAIL notification in history
        await pool.query(
          `INSERT INTO hrms_notification_history 
          (template_name, sent_date, sent_time, channel, status, subject, content, is_read) 
          VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?, 0)`,
          [
            'Birthday Reminder',
            'EMAIL',
            'SENT',
            subject,
            content
          ]
        );

        // Also record IN_APP bell notification so it shows in the bell icon
        await pool.query(
          `INSERT INTO hrms_notification_history 
          (template_name, sent_date, sent_time, channel, status, subject, content, is_read) 
          VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?, 0)`,
          [
            'Birthday Reminder',
            'IN_APP',
            'SENT',
            subject,
            content
          ]
        );
      }

      return res.json({
        success: true,
        message: `${upcomingBirthdays.length} birthday reminders sent successfully`
      });
    } catch (error) {
      console.error('Error sending birthday reminders:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Normal creation logic
  if (!employeeId || !birthDate || daysUntilBirthday === undefined) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO birthday_reminders (employee_id, birth_date, days_until_birthday, notification_sent, manager_notified) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE birth_date = VALUES(birth_date), days_until_birthday = VALUES(days_until_birthday)',
      [employeeId, birthDate, daysUntilBirthday, notificationSent ? 1 : 0, managerNotified ? 1 : 0]
    );
    res.status(201).json({ success: true, message: 'Birthday Reminder created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating birthday reminder:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateBirthdayReminder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employeeId, birthDate, daysUntilBirthday, notificationSent, managerNotified } = req.body;

  try {
    const [result]: any = await pool.query(
      'UPDATE birthday_reminders SET employee_id = ?, birth_date = ?, days_until_birthday = ?, notification_sent = ?, manager_notified = ? WHERE id = ?',
      [employeeId, birthDate, daysUntilBirthday, notificationSent ? 1 : 0, managerNotified ? 1 : 0, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Birthday Reminder not found' });
    }
    res.json({ success: true, message: 'Birthday Reminder updated successfully' });
  } catch (error) {
    console.error('Error updating birthday reminder:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteBirthdayReminder = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM birthday_reminders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Birthday Reminder not found' });
    }
    res.json({ success: true, message: 'Birthday Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting birthday reminder:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
