import pool from './src/db';

async function run() {
  try {
    const [templates]: any = await pool.query('SELECT * FROM kra_templates');
    console.log('Templates:', templates);
    
    const [assignments]: any = await pool.query('SELECT * FROM kra_assignments');
    console.log('Assignments:', assignments);
    
    // Let's manually create an assignment for Gaurav if a template exists
    if (templates.length > 0 && assignments.length === 0) {
       console.log('Assigning template to Gaurav...');
       await pool.query('INSERT INTO kra_assignments (templateId, employeeId, reportingManagerId, assignedDate) VALUES (?, ?, ?, ?)', [templates[0].id, '1', '1', '2026-08-01']);
       const [newAssignments]: any = await pool.query('SELECT * FROM kra_assignments');
       console.log('New Assignments:', newAssignments);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
