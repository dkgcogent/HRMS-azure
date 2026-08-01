import pool from './src/db';

async function run() {
  try {
    // 1. Get the ID of employee1
    const [rows]: any = await pool.query("SELECT id FROM hrms_users WHERE username = 'employee1'");
    if (rows.length === 0) {
      console.log('employee1 not found.');
      return;
    }
    const empId = rows[0].id;

    // 2. Delete tasks assigned to or created by this user
    await pool.query("DELETE FROM hrms_tasks WHERE assigned_to = ?", [empId]);
    await pool.query("DELETE FROM hrms_tasks WHERE created_by = ?", [empId]);

    // 3. Delete the user
    const [result]: any = await pool.query("DELETE FROM hrms_users WHERE id = ?", [empId]);
    console.log('Deleted employee1 rows:', result.affectedRows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
