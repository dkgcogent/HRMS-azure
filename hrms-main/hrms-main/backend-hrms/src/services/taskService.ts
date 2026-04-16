// @ts-nocheck
import pool from '../db';

export interface Task {
  id?: number;
  title: string;
  description?: string;
  assignedTo: number;
  createdBy: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  closedAt?: string;
}

export interface TaskComment {
  id?: number;
  taskId: number;
  userId: number;
  comment: string;
  createdAt?: string;
  userName?: string;
  userEmail?: string;
}

export interface TaskFile {
  id?: number;
  taskId: number;
  userId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
  userName?: string;
}

export interface TaskActivityLog {
  id?: number;
  taskId: number;
  userId: number;
  activityType: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  attachmentPath?: string;
  timestamp?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Create a new task
 */
export async function createTask(taskData: Partial<Task>, userId: number): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO hrms_tasks (title, description, assigned_to, created_by, priority, status, deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      taskData.title,
      taskData.description || null,
      taskData.assignedTo,
      userId,
      taskData.priority || 'MEDIUM',
      taskData.status || 'PENDING',
      taskData.deadline || null,
    ]
  );

  const taskId = result.insertId;

  // Log activity
  await logTaskActivity(taskId, userId, 'TASK_CREATED', null, JSON.stringify({
    title: taskData.title,
    status: taskData.status || 'PENDING',
    priority: taskData.priority || 'MEDIUM'
  }));

  return taskId;
}

/**
 * Get tasks for employee (assigned to them)
 */
export async function getEmployeeTasks(employeeId: number, filters?: {
  status?: string;
  priority?: string;
  deadline?: string;
}): Promise<any[]> {
  try {
    let query = `
      SELECT t.*,
             u1.full_name as assigned_to_name, u1.email as assigned_to_email,
             u2.full_name as created_by_name, u2.email as created_by_email
      FROM hrms_tasks t
      JOIN hrms_users u1 ON t.assigned_to = u1.id
      JOIN hrms_users u2 ON t.created_by = u2.id
      WHERE t.assigned_to = ? AND t.status != 'CANCELLED'
    `;
    const params: any[] = [employeeId];

    if (filters?.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters?.priority) {
      query += ' AND t.priority = ?';
      params.push(filters.priority);
    }

    if (filters?.deadline) {
      query += ' AND t.deadline = ?';
      params.push(filters.deadline);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows]: any = await pool.query(query, params);
    return rows || [];
  } catch (error: any) {
    console.error('Error in getEmployeeTasks:', error);
    // If table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
      console.warn('Tasks table does not exist. Please run the SQL schema file.');
      return [];
    }
    throw error;
  }
}

/**
 * Get tasks for HR (tasks they created or can manage)
 */
export async function getHRTasks(hrId: number, filters?: {
  status?: string;
  priority?: string;
  assignedTo?: number;
}): Promise<any[]> {
  try {
    let query = `
      SELECT t.*,
             u1.full_name as assigned_to_name, u1.email as assigned_to_email,
             u2.full_name as created_by_name, u2.email as created_by_email
      FROM hrms_tasks t
      JOIN hrms_users u1 ON t.assigned_to = u1.id
      JOIN hrms_users u2 ON t.created_by = u2.id
      WHERE t.created_by = ? AND t.status != 'CANCELLED'
    `;
    const params: any[] = [hrId];

    if (filters?.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters?.priority) {
      query += ' AND t.priority = ?';
      params.push(filters.priority);
    }

    if (filters?.assignedTo) {
      query += ' AND t.assigned_to = ?';
      params.push(filters.assignedTo);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows]: any = await pool.query(query, params);
    return rows || [];
  } catch (error: any) {
    console.error('Error in getHRTasks:', error);
    // If table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
      console.warn('Tasks table does not exist. Please run the SQL schema file.');
      return [];
    }
    throw error;
  }
}

/**
 * Get all tasks (Admin view)
 */
export async function getAllTasks(filters?: {
  status?: string;
  priority?: string;
  assignedTo?: number;
  createdBy?: number;
}): Promise<any[]> {
  try {
    let query = `
      SELECT t.*,
             u1.full_name as assigned_to_name, u1.email as assigned_to_email,
             u2.full_name as created_by_name, u2.email as created_by_email
      FROM hrms_tasks t
      JOIN hrms_users u1 ON t.assigned_to = u1.id
      JOIN hrms_users u2 ON t.created_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters?.priority) {
      query += ' AND t.priority = ?';
      params.push(filters.priority);
    }

    if (filters?.assignedTo) {
      query += ' AND t.assigned_to = ?';
      params.push(filters.assignedTo);
    }

    if (filters?.createdBy) {
      query += ' AND t.created_by = ?';
      params.push(filters.createdBy);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows]: any = await pool.query(query, params);
    return rows || [];
  } catch (error: any) {
    console.error('Error in getAllTasks:', error);
    // If table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
      console.warn('Tasks table does not exist. Please run the SQL schema file.');
      return [];
    }
    throw error;
  }
}

/**
 * Get task by ID with all related data
 */
export async function getTaskById(taskId: number): Promise<any> {
  const [rows]: any = await pool.query(
    `SELECT t.*,
            u1.full_name as assigned_to_name, u1.email as assigned_to_email,
            u2.full_name as created_by_name, u2.email as created_by_email
     FROM hrms_tasks t
     JOIN hrms_users u1 ON t.assigned_to = u1.id
     JOIN hrms_users u2 ON t.created_by = u2.id
     WHERE t.id = ?`,
    [taskId]
  );

  if (rows.length === 0) {
    return null;
  }

  const task = rows[0];

  // Get comments
  const [comments]: any = await pool.query(
    `SELECT tc.*, u.full_name as user_name, u.email as user_email
     FROM hrms_task_comments tc
     JOIN hrms_users u ON tc.user_id = u.id
     WHERE tc.task_id = ?
     ORDER BY tc.created_at ASC`,
    [taskId]
  );

  // Get files
  const [files]: any = await pool.query(
    `SELECT tf.*, u.full_name as user_name
     FROM hrms_task_files tf
     JOIN hrms_users u ON tf.user_id = u.id
     WHERE tf.task_id = ?
     ORDER BY tf.uploaded_at DESC`,
    [taskId]
  );

  // Get activity logs
  const [logs]: any = await pool.query(
    `SELECT tal.*, u.full_name as user_name, u.email as user_email
     FROM hrms_task_activity_log tal
     JOIN hrms_users u ON tal.user_id = u.id
     WHERE tal.task_id = ?
     ORDER BY tal.timestamp DESC`,
    [taskId]
  );

  return {
    ...task,
    comments: comments || [],
    files: files || [],
    activityLogs: logs || [],
  };
}

/**
 * Update task
 */
export async function updateTask(
  taskId: number,
  taskData: Partial<Task>,
  userId: number
): Promise<void> {
  const oldTask = await getTaskById(taskId);
  if (!oldTask) {
    throw new Error('Task not found');
  }

  const updates: string[] = [];
  const params: any[] = [];
  const changes: any = {};

  if (taskData.title !== undefined && taskData.title !== oldTask.title) {
    updates.push('title = ?');
    params.push(taskData.title);
    changes.title = { old: oldTask.title, new: taskData.title };
  }

  if (taskData.description !== undefined && taskData.description !== oldTask.description) {
    updates.push('description = ?');
    params.push(taskData.description);
    changes.description = { old: oldTask.description, new: taskData.description };
  }

  if (taskData.priority !== undefined && taskData.priority !== oldTask.priority) {
    updates.push('priority = ?');
    params.push(taskData.priority);
    changes.priority = { old: oldTask.priority, new: taskData.priority };
  }

  if (taskData.deadline !== undefined && taskData.deadline !== oldTask.deadline) {
    updates.push('deadline = ?');
    params.push(taskData.deadline);
    changes.deadline = { old: oldTask.deadline, new: taskData.deadline };
  }

  if (updates.length > 0) {
    params.push(taskId);
    await pool.query(
      `UPDATE hrms_tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Log activity
    await logTaskActivity(taskId, userId, 'TASK_UPDATED', JSON.stringify(changes), null);
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: number,
  newStatus: string,
  userId: number
): Promise<void> {
  const oldTask = await getTaskById(taskId);
  if (!oldTask) {
    throw new Error('Task not found');
  }

  const updateFields: string[] = ['status = ?'];
  const params: any[] = [newStatus];

  if (newStatus === 'COMPLETED' && oldTask.status !== 'COMPLETED') {
    updateFields.push('completed_at = CURRENT_TIMESTAMP');
  }

  if (newStatus === 'CLOSED' && oldTask.status !== 'CLOSED') {
    updateFields.push('closed_at = CURRENT_TIMESTAMP');
  }

  if (newStatus !== 'COMPLETED' && oldTask.status === 'COMPLETED') {
    updateFields.push('completed_at = NULL');
  }

  if (newStatus !== 'CLOSED' && oldTask.status === 'CLOSED') {
    updateFields.push('closed_at = NULL');
  }

  params.push(taskId);

  await pool.query(
    `UPDATE hrms_tasks SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );

  // Log activity
  await logTaskActivity(
    taskId,
    userId,
    'STATUS_CHANGED',
    oldTask.status,
    newStatus
  );
}

/**
 * Reassign task
 */
export async function reassignTask(
  taskId: number,
  newAssigneeId: number,
  userId: number
): Promise<void> {
  const oldTask = await getTaskById(taskId);
  if (!oldTask) {
    throw new Error('Task not found');
  }

  await pool.query(
    'UPDATE hrms_tasks SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newAssigneeId, taskId]
  );

  // Log activity
  await logTaskActivity(
    taskId,
    userId,
    'TASK_REASSIGNED',
    oldTask.assigned_to.toString(),
    newAssigneeId.toString()
  );
}

/**
 * Add comment to task
 */
export async function addTaskComment(
  taskId: number,
  comment: string,
  userId: number
): Promise<number> {
  const [result]: any = await pool.query(
    'INSERT INTO hrms_task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
    [taskId, userId, comment]
  );

  // Log activity
  await logTaskActivity(taskId, userId, 'COMMENT_ADDED', null, null, comment);

  return result.insertId;
}

/**
 * Upload file to task
 */
export async function addTaskFile(
  taskId: number,
  fileData: {
    fileName: string;
    filePath: string;
    fileSize?: number;
    fileType?: string;
  },
  userId: number
): Promise<number> {
  const [result]: any = await pool.query(
    `INSERT INTO hrms_task_files (task_id, user_id, file_name, file_path, file_size, file_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [taskId, userId, fileData.fileName, fileData.filePath, fileData.fileSize || null, fileData.fileType || null]
  );

  // Log activity
  await logTaskActivity(
    taskId,
    userId,
    'FILE_UPLOADED',
    null,
    fileData.fileName,
    null,
    fileData.filePath
  );

  return result.insertId;
}

/**
 * Get task activity logs
 */
export async function getTaskActivityLogs(taskId: number): Promise<TaskActivityLog[]> {
  const [rows]: any = await pool.query(
    `SELECT tal.*, u.full_name as user_name, u.email as user_email
     FROM hrms_task_activity_log tal
     JOIN hrms_users u ON tal.user_id = u.id
     WHERE tal.task_id = ?
     ORDER BY tal.timestamp DESC`,
    [taskId]
  );

  return rows || [];
}

/**
 * Log task activity
 */
export async function logTaskActivity(
  taskId: number,
  userId: number,
  activityType: string,
  oldValue: string | null = null,
  newValue: string | null = null,
  comment: string | null = null,
  attachmentPath: string | null = null
): Promise<void> {
  await pool.query(
    `INSERT INTO hrms_task_activity_log 
     (task_id, user_id, activity_type, old_value, new_value, comment, attachment_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [taskId, userId, activityType, oldValue, newValue, comment, attachmentPath]
  );
}

/**
 * Get task statistics for dashboard
 */
export async function getTaskStats(userId: number, role: string): Promise<{
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}> {
  try {
    let query = '';
    const params: any[] = [];

    if (role === 'employee') {
      query = `
        SELECT 
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          COUNT(*) as total
        FROM hrms_tasks
        WHERE assigned_to = ? AND status != 'CANCELLED'
      `;
      params.push(userId);
    } else if (role === 'hr') {
      query = `
        SELECT 
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          COUNT(*) as total
        FROM hrms_tasks
        WHERE created_by = ? AND status != 'CANCELLED'
      `;
      params.push(userId);
    } else {
      // admin
      query = `
        SELECT 
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          COUNT(*) as total
        FROM hrms_tasks
        WHERE status != 'CANCELLED'
      `;
    }

    const [rows]: any = await pool.query(query, params);
    const stats = rows[0] || {};

    return {
      pending: parseInt(stats.pending) || 0,
      inProgress: parseInt(stats.in_progress) || 0,
      completed: parseInt(stats.completed) || 0,
      total: parseInt(stats.total) || 0,
    };
  } catch (error: any) {
    console.error('Error in getTaskStats:', error);
    // If table doesn't exist, return default stats
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
      console.warn('Tasks table does not exist. Please run the SQL schema file.');
      return {
        pending: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
      };
    }
    throw error;
  }
}

/**
 * Get all users for task assignment
 */
export async function getAllUsers(): Promise<any[]> {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, full_name as name, email, role, employee_id FROM hrms_users ORDER BY full_name'
    );
    return rows || [];
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    // If table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
      console.warn('users table does not exist. Please ensure the database is set up.');
      return [];
    }
    throw error;
  }
}

