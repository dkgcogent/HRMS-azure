import pool from './src/db';

async function run() {
  try {
    console.log('Adding signed_pdf_path column...');
    await pool.query(`ALTER TABLE hrms_appointment_letters ADD COLUMN signed_pdf_path VARCHAR(255) NULL`);
    console.log('Success');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error('Error:', err);
    }
  } finally {
    await pool.end();
  }
}

run();
