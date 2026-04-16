import { Request, Response } from 'express';
import pool from '../db';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get counts from various tables
    const [employeesResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_employees');
    const [departmentsResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_departments');
    const [designationsResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_designations');
    const [activeEmployeesResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_employees WHERE status = "ACTIVE"');
    const [shiftsResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_shifts');
    const [workLocationsResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_work_locations');
    const [banksResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_banks');
    const [paymentModesResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_payment_modes');
    const [qualificationsResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_qualifications');
    const [documentTypesResult] = await pool.execute('SELECT COUNT(*) as count FROM hrms_document_types');

    const stats = {
      totalEmployees: (employeesResult as any)[0].count,
      totalDepartments: (departmentsResult as any)[0].count,
      totalDesignations: (designationsResult as any)[0].count,
      activeEmployees: (activeEmployeesResult as any)[0].count,
      totalShifts: (shiftsResult as any)[0].count,
      totalWorkLocations: (workLocationsResult as any)[0].count,
      totalBanks: (banksResult as any)[0].count,
      totalPaymentModes: (paymentModesResult as any)[0].count,
      totalQualifications: (qualificationsResult as any)[0].count,
      totalDocumentTypes: (documentTypesResult as any)[0].count,
    };

    res.json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    // Get recent activities from various tables
    const [recentEmployees] = await pool.execute(`
      SELECT 
        'employee' as type,
        CONCAT('New employee ', first_name, ' ', last_name, ' joined') as description,
        created_at as time,
        'Employee Added' as action
      FROM hrms_employees 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    const [recentDepartments] = await pool.execute(`
      SELECT 
        'master' as type,
        CONCAT('Department "', name, '" was created') as description,
        created_at as time,
        'Department Created' as action
      FROM hrms_departments 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    // Combine and sort activities
    const activities = [
      ...(recentEmployees as any[]).map((emp, index) => ({
        id: `emp_${index}`,
        type: emp.type,
        action: emp.action,
        description: emp.description,
        time: emp.time,
        icon: 'PersonAdd'
      })),
      ...(recentDepartments as any[]).map((dept, index) => ({
        id: `dept_${index}`,
        type: dept.type,
        action: dept.action,
        description: dept.description,
        time: dept.time,
        icon: 'Business'
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    res.json({
      success: true,
      message: 'Recent activities fetched successfully',
      data: activities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    // Check database connection
    const [dbCheck] = await pool.execute('SELECT 1 as status');
    
    const health = {
      database: 'healthy',
      server: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    res.json({
      success: true,
      message: 'System health check completed',
      data: health
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'System health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
