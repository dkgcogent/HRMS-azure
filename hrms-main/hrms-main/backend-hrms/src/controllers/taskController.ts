// @ts-nocheck
import { Request, Response } from 'express';
import { AuthUser } from '../middleware/auth';
import {
  createTask,
  getEmployeeTasks,
  getHRTasks,
  getAllTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  reassignTask,
  addTaskComment,
  addTaskFile,
  getTaskActivityLogs,
  getTaskStats,
  getAllUsers,
  Task,
} from '../services/taskService';
import path from 'path';
import { UPLOAD_BASE_DIR } from '../config/uploadConfig';
import { uploadBufferToBlob, getBlobUrl } from '../services/azureBlobService';

/**
 * Create a new task (HR/Admin only)
 */
export const createNewTask = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;

  try {
    const taskData: Partial<Task> = {
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo,
      priority: req.body.priority || 'MEDIUM',
      status: req.body.status || 'PENDING',
      deadline: req.body.deadline || null,
    };

    if (!taskData.title || !taskData.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title and assignedTo are required',
      });
    }

    const taskId = await createTask(taskData, user.id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { id: taskId },
    });
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Get tasks for employee
 */
export const getMyTasks = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;

  try {
    const { status, priority, deadline } = req.query;
    const tasks = await getEmployeeTasks(user.id, {
      status: status as string,
      priority: priority as string,
      deadline: deadline as string,
    });

    res.json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
    });
  } catch (error: any) {
    console.error('Error fetching employee tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get tasks for HR
 */
export const getHRTaskList = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;

  try {
    const { status, priority, assignedTo } = req.query;
    const tasks = await getHRTasks(user.id, {
      status: status as string,
      priority: priority as string,
      assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined,
    });

    res.json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
    });
  } catch (error: any) {
    console.error('Error fetching HR tasks:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get all tasks (Admin only)
 */
export const getAllTaskList = async (req: Request, res: Response) => {
  try {
    const { status, priority, assignedTo, createdBy } = req.query;
    const tasks = await getAllTasks({
      status: status as string,
      priority: priority as string,
      assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined,
      createdBy: createdBy ? parseInt(createdBy as string) : undefined,
    });

    res.json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
    });
  } catch (error: any) {
    console.error('Error fetching all tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get task by ID
 */
export const getTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await getTaskById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      message: 'Task fetched successfully',
      data: task,
    });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update task (HR/Admin only)
 */
export const updateExistingTask = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;

  try {
    const taskData: Partial<Task> = {};

    if (req.body.title !== undefined) taskData.title = req.body.title;
    if (req.body.description !== undefined) taskData.description = req.body.description;
    if (req.body.priority !== undefined) taskData.priority = req.body.priority;
    if (req.body.deadline !== undefined) taskData.deadline = req.body.deadline;

    await updateTask(parseInt(id), taskData, user.id);

    res.json({
      success: true,
      message: 'Task updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Update task status (Employee can update their own tasks)
 */
export const updateTaskStatusController = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    await updateTaskStatus(parseInt(id), status, user.id);

    res.json({
      success: true,
      message: 'Task status updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Reassign task (HR/Admin only)
 */
export const reassignTaskController = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { assignedTo } = req.body;

  try {
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'assignedTo is required',
      });
    }

    await reassignTask(parseInt(id), parseInt(assignedTo), user.id);

    res.json({
      success: true,
      message: 'Task reassigned successfully',
    });
  } catch (error: any) {
    console.error('Error reassigning task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Add comment to task
 */
export const addComment = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { comment } = req.body;

  try {
    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      });
    }

    const commentId = await addTaskComment(parseInt(id), comment.trim(), user.id);

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: { id: commentId },
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Upload file to task
 */
export const uploadFile = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Upload to Azure instead of using local path
    const folderPrefix = 'tasks/attachments';
    const blobName = await uploadBufferToBlob(
      file.buffer,
      file.originalname,
      folderPrefix,
      file.mimetype
    );

    // Get the public URL for the blob
    const fileUrl = getBlobUrl(blobName);

    const fileData = {
      fileName: file.originalname,
      filePath: fileUrl,
      fileSize: file.size,
      fileType: file.mimetype,
    };

    const fileId = await addTaskFile(parseInt(id), fileData, user.id);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: { id: fileId, ...fileData },
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get task activity logs
 */
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await getTaskActivityLogs(parseInt(id));

    res.json({
      success: true,
      message: 'Activity logs fetched successfully',
      data: logs,
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get task statistics for dashboard
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;

  try {
    const stats = await getTaskStats(user.id, user.role);

    res.json({
      success: true,
      message: 'Statistics fetched successfully',
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    console.error('Error stack:', error.stack);
    // Return default stats if table doesn't exist yet
    res.json({
      success: true,
      message: 'Statistics fetched successfully',
      data: {
        pending: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
      },
    });
  }
};

/**
 * Get all users (for task assignment dropdowns)
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    res.json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Close task (HR/Admin only)
 */
export const closeTask = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;

  try {
    await updateTaskStatus(parseInt(id), 'CLOSED', user.id);

    res.json({
      success: true,
      message: 'Task closed successfully',
    });
  } catch (error: any) {
    console.error('Error closing task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Reopen task (Admin only)
 */
export const reopenTask = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { status } = req.body;

  try {
    const newStatus = status || 'PENDING';
    await updateTaskStatus(parseInt(id), newStatus, user.id);

    res.json({
      success: true,
      message: 'Task reopened successfully',
    });
  } catch (error: any) {
    console.error('Error reopening task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

