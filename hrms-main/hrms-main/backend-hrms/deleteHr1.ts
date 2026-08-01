import pool from './src/db';

async function run() {
  try {
    const [result]: any = await pool.query("DELETE FROM hrms_users WHERE username = 'hr1'");
    console.log('Deleted hr1 rows:', result.affectedRows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
