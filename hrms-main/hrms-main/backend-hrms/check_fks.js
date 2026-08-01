const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'hrms'});
  try {
    const [rows] = await pool.query("SELECT TABLE_NAME FROM information_schema.key_column_usage WHERE REFERENCED_TABLE_NAME = 'hrms_employees'");
    console.log(rows);
  } catch (e) { console.error(e); }
  process.exit(0);
}
run();
