
import { Request, Response } from 'express';
import pool from '../db';
import { AuthUser } from '../middleware/auth';

export const getAllJobOpenings = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_job_openings');
    res.json({ success: true, message: "Job Openings fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching job openings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getJobOpeningById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_job_openings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job Opening not found' });
    }
    res.json({ success: true, message: "Job Opening fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching job opening by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createJobOpening = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { title, description, department_id, status, assigned_to, task_status } = req.body;
  if (!title || !department_id) {
    return res.status(400).json({ success: false, message: 'Title and Department ID are required' });
  }
  try {
    const [result]: any = await pool.query(
      'INSERT INTO hrms_job_openings (title, description, department_id, status, assigned_to, task_status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, department_id, status || 'OPEN', assigned_to || null, task_status || 'PENDING']
    );
    
    // Log activity
    if (user?.id) {
      await pool.query(
        'INSERT INTO hrms_job_activities (job_opening_id, actor_id, action, description, new_value) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, user.id, 'CREATED', `Job opening "${title}" created`, JSON.stringify({ title, department_id, status: status || 'OPEN' })]
      );
    }
    
    res.status(201).json({ success: true, message: 'Job Opening created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating job opening:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateJobOpening = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { title, description, department_id, status, assigned_to, progress, task_status } = req.body;
  if (!title || !department_id) {
    return res.status(400).json({ success: false, message: 'Title and Department ID are required' });
  }
  try {
    // Get old values for activity log
    const [oldRows]: any = await pool.query('SELECT * FROM hrms_job_openings WHERE id = ?', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job Opening not found' });
    }
    const oldValues = oldRows[0];
    
    // Update job opening
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (department_id !== undefined) { updateFields.push('department_id = ?'); updateValues.push(department_id); }
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }
    if (assigned_to !== undefined) { updateFields.push('assigned_to = ?'); updateValues.push(assigned_to); }
    if (progress !== undefined) { updateFields.push('progress = ?'); updateValues.push(progress); }
    if (task_status !== undefined) { updateFields.push('task_status = ?'); updateValues.push(task_status); }
    
    updateValues.push(id);
    
    const [result]: any = await pool.query(
      `UPDATE hrms_job_openings SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Job Opening not found' });
    }
    
    // Log activity
    if (user?.id) {
      const newValues: any = {};
      if (title !== undefined) newValues.title = title;
      if (assigned_to !== undefined) newValues.assigned_to = assigned_to;
      if (progress !== undefined) newValues.progress = progress;
      if (task_status !== undefined) newValues.task_status = task_status;
      
      await pool.query(
        'INSERT INTO hrms_job_activities (job_opening_id, actor_id, action, description, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          user.id,
          'UPDATED',
          `Job opening "${title || oldValues.title}" updated`,
          JSON.stringify(oldValues),
          JSON.stringify(newValues)
        ]
      );
    }
    
    res.json({ success: true, message: 'Job Opening updated successfully' });
  } catch (error) {
    console.error('Error updating job opening:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteJobOpening = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  try {
    // Get job details before deletion for activity log
    const [oldRows]: any = await pool.query('SELECT * FROM hrms_job_openings WHERE id = ?', [id]);
    
    const [result]: any = await pool.query('DELETE FROM hrms_job_openings WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Job Opening not found' });
    }
    
    // Log activity
    if (user?.id && oldRows.length > 0) {
      await pool.query(
        'INSERT INTO hrms_job_activities (job_opening_id, actor_id, action, description, old_value) VALUES (?, ?, ?, ?, ?)',
        [
          id,
          user.id,
          'DELETED',
          `Job opening "${oldRows[0].title}" deleted`,
          JSON.stringify(oldRows[0])
        ]
      );
    }
    
    res.json({ success: true, message: 'Job Opening deleted successfully' });
  } catch (error) {
    console.error('Error deleting job opening:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Assign job to user
export const assignJob = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { assigned_to } = req.body;
  
  if (!assigned_to) {
    return res.status(400).json({ success: false, message: 'assigned_to is required' });
  }
  
  try {
    // Get old values
    const [oldRows]: any = await pool.query('SELECT * FROM hrms_job_openings WHERE id = ?', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job Opening not found' });
    }
    
    // Update assignment
    await pool.query('UPDATE hrms_job_openings SET assigned_to = ?, task_status = ? WHERE id = ?', 
      [assigned_to, 'IN_PROGRESS', id]);
    
    // Log activity
    if (user?.id) {
      await pool.query(
        'INSERT INTO hrms_job_activities (job_opening_id, actor_id, action, description, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          user.id,
          'ASSIGNED',
          `Job assigned to employee ${assigned_to}`,
          JSON.stringify({ assigned_to: oldRows[0].assigned_to, task_status: oldRows[0].task_status }),
          JSON.stringify({ assigned_to, task_status: 'IN_PROGRESS' })
        ]
      );
    }
    
    res.json({ success: true, message: 'Job assigned successfully' });
  } catch (error) {
    console.error('Error assigning job:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update job progress
export const updateJobProgress = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { progress, task_status, description } = req.body;
  
  if (progress === undefined && task_status === undefined) {
    return res.status(400).json({ success: false, message: 'progress or task_status is required' });
  }
  
  try {
    // Get old values
    const [oldRows]: any = await pool.query('SELECT * FROM hrms_job_openings WHERE id = ?', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job Opening not found' });
    }
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (progress !== undefined) {
      updateFields.push('progress = ?');
      updateValues.push(Math.max(0, Math.min(100, progress))); // Clamp between 0-100
    }
    if (task_status !== undefined) {
      updateFields.push('task_status = ?');
      updateValues.push(task_status);
    }
    
    updateValues.push(id);
    
    await pool.query(
      `UPDATE hrms_job_openings SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Log activity
    if (user?.id) {
      const newValues: any = {};
      if (progress !== undefined) newValues.progress = progress;
      if (task_status !== undefined) newValues.task_status = task_status;
      
      await pool.query(
        'INSERT INTO hrms_job_activities (job_opening_id, actor_id, action, description, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          user.id,
          'PROGRESS_UPDATED',
          description || `Progress updated to ${progress !== undefined ? progress + '%' : ''} ${task_status || ''}`.trim(),
          JSON.stringify({ progress: oldRows[0].progress, task_status: oldRows[0].task_status }),
          JSON.stringify(newValues)
        ]
      );
    }
    
    res.json({ success: true, message: 'Job progress updated successfully' });
  } catch (error) {
    console.error('Error updating job progress:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get job activities
export const getJobActivities = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(
      `SELECT ja.*, e.first_name, e.last_name, e.employee_id 
       FROM hrms_job_activities ja
       LEFT JOIN hrms_employees e ON ja.actor_id = e.id
       WHERE ja.job_opening_id = ?
       ORDER BY ja.created_at DESC`,
      [id]
    );
    res.json({ success: true, message: 'Job activities fetched successfully', data: rows });
  } catch (error) {
    console.error('Error fetching job activities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
