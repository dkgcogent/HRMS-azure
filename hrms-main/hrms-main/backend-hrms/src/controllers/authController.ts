import { Request, Response } from 'express';
import pool from '../db';
import { AuthUser } from '../middleware/auth';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt: any = require('bcryptjs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt: any = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_TTL = process.env.JWT_TTL || '8h';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    await ensureUsersTable();
    await seedDemoUsers();
    await ensureAdminUser(); // make sure an admin account always exists

    const [rows]: any = await pool.query(
      'SELECT id, username, full_name, role, password_hash, employee_id, department_id FROM hrms_users WHERE username = ?',
      [username]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentId: user.department_id ?? null,
        employeeId: user.employee_id ?? null,
      },
      JWT_SECRET,
      { expiresIn: JWT_TTL }
    );

    return res.json({
      token,
      role: user.role,
      fullName: user.full_name,
      username: user.username,
      employeeId: user.employee_id,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    // More specific error messages
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'Database connection failed. Please check database configuration.' });
    }
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Database table not found. Please run database migrations.' });
    }
    return res.status(500).json({ error: err.message || 'Internal server error', code: err.code, stack: err.stack, details: err });
  }
};

async function ensureUsersTable() {
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
}

async function seedDemoUsers() {
  // Seed only if table has no rows
  const [rows]: any = await pool.query('SELECT COUNT(*) as cnt FROM hrms_users');
  if (rows[0].cnt > 0) return;

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
  const users = [
    ['employee1', 'Employee One', 'employee', hash('emp123'), null, null],
    ['hr1', 'HR One', 'hr', hash('hr123'), null, null],
    ['admin', 'Admin User', 'admin', hash('admin123'), null, null],
  ];
  await pool.query(
    'INSERT INTO hrms_users (username, full_name, role, password_hash, employee_id, department_id) VALUES ?',
    [users]
  );
}

async function ensureAdminUser() {
  const [rows]: any = await pool.query('SELECT COUNT(*) as cnt FROM hrms_users WHERE username = ?', ['admin']);
  if (rows[0].cnt > 0) return;

  const passwordHash = bcrypt.hashSync('admin123', 10);
  await pool.query(
    'INSERT INTO hrms_users (username, full_name, role, password_hash, employee_id, department_id) VALUES (?, ?, ?, ?, ?, ?)',
    ['admin', 'Admin User', 'admin', passwordHash, null, null]
  );
}

/**
 * Get current user information
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get latest user info from database
    const [rows]: any = await pool.query(
      'SELECT id, username, full_name, email, role, employee_id, department_id FROM hrms_users WHERE id = ?',
      [user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = rows[0];

    res.json({
      success: true,
      data: {
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name,
        email: userData.email,
        role: userData.role,
        employeeId: userData.employee_id,
        departmentId: userData.department_id,
      },
    });
  } catch (error: any) {
    console.error('Error getting current user:', error);
    res.status(500).json({ success: false, message: 'Failed to get user information' });
  }
};


