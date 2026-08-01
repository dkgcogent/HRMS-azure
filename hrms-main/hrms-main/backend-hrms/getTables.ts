import pool from './src/db';

async function run() {
  try {
    const [rows]: any = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name LIKE 'hrms_%'
    `);
    
    console.log('Tables:');
    rows.forEach((row: any) => console.log(row.table_name || row.TABLE_NAME));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
