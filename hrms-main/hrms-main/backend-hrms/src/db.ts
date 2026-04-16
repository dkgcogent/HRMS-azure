import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MySQL Connection Pool Configuration
 *
 * IMPORTANT TIMEZONE SETTINGS:
 * - timezone: '+05:30' ensures all datetime operations use IST (Asia/Kolkata)
 * - dateStrings: true prevents mysql2 from converting DATE/DATETIME to JavaScript Date objects
 *   This is CRITICAL to avoid timezone conversion issues when dates are serialized to JSON
 *
 * Without dateStrings: true, mysql2 returns Date objects which get converted to UTC ISO strings
 * when sent as JSON response, causing date shifts (e.g., 2025-12-20 becomes 2025-12-19T18:30:00Z)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'hrms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // CRITICAL: Return dates as strings to prevent timezone conversion issues
  dateStrings: true,
  // Set timezone to IST for all datetime operations
  timezone: '+05:30',
  ssl: {
    rejectUnauthorized: false
  }
});

export const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('Database connection successful!');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

export default pool;