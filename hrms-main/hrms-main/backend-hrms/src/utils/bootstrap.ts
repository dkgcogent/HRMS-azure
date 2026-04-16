import pool from '../db';

export async function ensureCoreTables() {
  // Attendance adjunct tables and audit/rbac basics
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      role ENUM('employee','hr','admin') NOT NULL DEFAULT 'employee',
      password_hash VARCHAR(255) NOT NULL,
      employee_id INT NULL,
      department_id INT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_manual_attendance_requests (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      date DATE NOT NULL,
      check_in_time TIME NULL,
      check_out_time TIME NULL,
      reason TEXT,
      status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
      approved_by INT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_regularization_requests (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      attendance_id INT NOT NULL,
      requested_change TEXT NOT NULL,
      reason TEXT,
      status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
      approved_by INT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_geo_location_logs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      attendance_id INT NULL,
      latitude DECIMAL(10,8) NULL,
      longitude DECIMAL(11,8) NULL,
      ip_address VARCHAR(255) NULL,
      user_agent TEXT NULL,
      accuracy INT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_audit_logs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      actor_id INT NULL,
      actor_role ENUM('employee','hr','admin') NULL,
      action VARCHAR(100) NOT NULL,
      entity VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100) NULL,
      details JSON NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Asset management tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_asset_photos (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      asset_id INT NOT NULL,
      photo_path VARCHAR(500) NOT NULL,
      photo_name VARCHAR(255) NOT NULL,
      photo_size INT DEFAULT NULL,
      photo_type VARCHAR(50) DEFAULT NULL,
      is_primary TINYINT(1) DEFAULT 0,
      uploaded_by INT DEFAULT NULL,
      uploaded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      KEY asset_id (asset_id),
      KEY is_primary (is_primary),
      CONSTRAINT asset_photos_ibfk_1 FOREIGN KEY (asset_id) REFERENCES hrms_assets (id) ON DELETE CASCADE,
      CONSTRAINT asset_photos_ibfk_2 FOREIGN KEY (uploaded_by) REFERENCES hrms_users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `).catch((error: any) => {
    // If foreign key constraints fail (tables don't exist yet), create without constraints
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_CANNOT_ADD_FOREIGN') {
      console.log('Creating asset_photos table without foreign key constraints...');
      return pool.query(`
        CREATE TABLE IF NOT EXISTS hrms_asset_photos (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          asset_id INT NOT NULL,
          photo_path VARCHAR(500) NOT NULL,
          photo_name VARCHAR(255) NOT NULL,
          photo_size INT DEFAULT NULL,
          photo_type VARCHAR(50) DEFAULT NULL,
          is_primary TINYINT(1) DEFAULT 0,
          uploaded_by INT DEFAULT NULL,
          uploaded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          KEY asset_id (asset_id),
          KEY is_primary (is_primary)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
    }
    throw error;
  });

  // Task Management tables
  console.log('Ensuring task management tables exist...');

  // Create hrms_tasks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_tasks (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      assigned_to INT NOT NULL,
      created_by INT NOT NULL,
      priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
      status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
      deadline DATE NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      closed_at TIMESTAMP NULL,
      INDEX idx_assigned_to (assigned_to),
      INDEX idx_created_by (created_by),
      INDEX idx_status (status),
      INDEX idx_priority (priority),
      INDEX idx_deadline (deadline)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `).catch((error: any) => {
    console.warn('Note: tasks table creation:', error.message);
  });

  // Create hrms_task_comments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_task_comments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      user_id INT NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_task_id (task_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `).catch((error: any) => {
    console.warn('Note: task_comments table creation:', error.message);
  });

  // Create hrms_task_files table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_task_files (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      user_id INT NOT NULL,
      file_name VARCHAR(500) NOT NULL,
      file_path VARCHAR(1000) NOT NULL,
      file_size INT NULL,
      file_type VARCHAR(100) NULL,
      uploaded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_task_id (task_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `).catch((error: any) => {
    console.warn('Note: task_files table creation:', error.message);
  });

  // Create hrms_task_activity_log table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_task_activity_log (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      user_id INT NOT NULL,
      activity_type VARCHAR(100) NOT NULL,
      old_value TEXT NULL,
      new_value TEXT NULL,
      comment TEXT NULL,
      attachment_path VARCHAR(1000) NULL,
      timestamp TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_task_id (task_id),
      INDEX idx_user_id (user_id),
      INDEX idx_activity_type (activity_type),
      INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `).catch((error: any) => {
    console.warn('Note: task_activity_log table creation:', error.message);
  });

  // Communication & Notification tables
  console.log('Ensuring communication & notification tables exist...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_notification_templates (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type ENUM('BIRTHDAY', 'ANNIVERSARY', 'LEAVE_REMINDER', 'POLICY_UPDATE', 'TRAINING_REMINDER', 'CUSTOM') NOT NULL,
      subject VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      recipients ENUM('ALL', 'MANAGERS', 'HR', 'SPECIFIC') NOT NULL DEFAULT 'ALL',
      is_active TINYINT(1) DEFAULT 1,
      schedule_frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ONE_TIME') NULL,
      schedule_time TIME NULL,
      schedule_days_before INT DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_template_channels (
      template_id INT NOT NULL,
      channel ENUM('EMAIL', 'SMS', 'IN_APP') NOT NULL,
      PRIMARY KEY (template_id, channel),
      CONSTRAINT fk_template_channels_template FOREIGN KEY (template_id) REFERENCES hrms_notification_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_template_variables (
      template_id INT NOT NULL,
      variable_name VARCHAR(100) NOT NULL,
      PRIMARY KEY (template_id, variable_name),
      CONSTRAINT fk_template_variables_template FOREIGN KEY (template_id) REFERENCES hrms_notification_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_template_specific_recipients (
      template_id INT NOT NULL,
      employee_id INT NOT NULL,
      PRIMARY KEY (template_id, employee_id),
      CONSTRAINT fk_template_specific_template FOREIGN KEY (template_id) REFERENCES hrms_notification_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_notification_history (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      template_id INT NULL,
      template_name VARCHAR(255) NOT NULL,
      sent_date DATE NOT NULL,
      sent_time TIME NOT NULL,
      channel ENUM('EMAIL', 'SMS', 'IN_APP') NOT NULL,
      status ENUM('SENT', 'FAILED', 'PENDING') NOT NULL DEFAULT 'SENT',
      subject VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      error_message TEXT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Migrate existing hrms_notification_history table to add is_read column if missing
  await pool.query(`ALTER TABLE hrms_notification_history ADD COLUMN IF NOT EXISTS is_read TINYINT(1) NOT NULL DEFAULT 0`).catch((e: any) => {
    // Silently ignore - column may already exist or DB may not support IF NOT EXISTS for columns
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_notification_recipient_history (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      history_id INT NOT NULL,
      recipient_address VARCHAR(255) NOT NULL,
      CONSTRAINT fk_recipient_history FOREIGN KEY (history_id) REFERENCES hrms_notification_history(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_birthday_reminders (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      birth_date DATE NOT NULL,
      days_until_birthday INT NOT NULL,
      notification_sent TINYINT(1) DEFAULT 0,
      manager_notified TINYINT(1) DEFAULT 0,
      last_notified_at TIMESTAMP NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE(employee_id),
      CONSTRAINT fk_birthday_employee FOREIGN KEY (employee_id) REFERENCES hrms_employees(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_notification_settings (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      birthday_enabled TINYINT(1) DEFAULT 1,
      birthday_days_before INT DEFAULT 1,
      birthday_notify_managers TINYINT(1) DEFAULT 1,
      birthday_notify_hr TINYINT(1) DEFAULT 1,
      anniversary_enabled TINYINT(1) DEFAULT 1,
      anniversary_days_before INT DEFAULT 3,
      anniversary_notify_managers TINYINT(1) DEFAULT 1,
      leave_enabled TINYINT(1) DEFAULT 1,
      leave_pending_approval_hours INT DEFAULT 24,
      leave_unused_leave_months INT DEFAULT 3,
      policy_updates_enabled TINYINT(1) DEFAULT 1,
      policy_updates_require_acknowledgment TINYINT(1) DEFAULT 1,
      policy_updates_reminder_frequency INT DEFAULT 7,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Insert default notification settings if none exist
  const [settings]: any = await pool.query('SELECT id FROM hrms_notification_settings LIMIT 1');
  if (settings.length === 0) {
    await pool.query(`
      INSERT INTO hrms_notification_settings (
        id, birthday_enabled, birthday_days_before, birthday_notify_managers, birthday_notify_hr,
        anniversary_enabled, anniversary_days_before, anniversary_notify_managers,
        leave_enabled, leave_pending_approval_hours, leave_unused_leave_months,
        policy_updates_enabled, policy_updates_require_acknowledgment, policy_updates_reminder_frequency
      ) VALUES (1, 1, 1, 1, 1, 1, 3, 1, 1, 24, 3, 1, 1, 7)
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_notification_settings_channels (
      setting_id INT NOT NULL,
      setting_type ENUM('BIRTHDAY', 'ANNIVERSARY', 'LEAVE', 'POLICY') NOT NULL,
      channel ENUM('EMAIL', 'SMS', 'IN_APP') NOT NULL,
      PRIMARY KEY (setting_id, setting_type, channel),
      CONSTRAINT fk_settings_channels_setting FOREIGN KEY (setting_id) REFERENCES hrms_notification_settings(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  console.log('✓ Task management and communication tables ensured');

  // hrms_offer_letters table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hrms_offer_letters (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      candidate_name VARCHAR(255) NOT NULL,
      employee_id INT NULL,
      designation VARCHAR(255) NOT NULL,
      generated_date DATE NOT NULL,
      joining_date DATE NOT NULL,
      status ENUM('Draft', 'Sent', 'Viewed', 'Accepted') NOT NULL DEFAULT 'Draft',
      monthly_ctc DECIMAL(15,2) NULL,
      yearly_ctc DECIMAL(15,2) NULL,
      email VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      offer_data JSON NULL,
      pdf_path VARCHAR(1000) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `).catch((error: any) => {
    console.warn('Note: offer_letters table creation:', error.message);
  });
}


