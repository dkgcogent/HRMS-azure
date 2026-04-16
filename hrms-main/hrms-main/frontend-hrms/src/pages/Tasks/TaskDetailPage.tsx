import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid as MuiGrid,
  GridProps,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { TaskStatusBadge } from '../../components/Tasks/TaskStatusBadge';
import { PriorityLabel } from '../../components/Tasks/PriorityLabel';
import { DeadlineChip } from '../../components/Tasks/DeadlineChip';
import { CommentBox, Comment } from '../../components/Tasks/CommentBox';
import { FileUploadButton, TaskFile } from '../../components/Tasks/FileUploadButton';
import { ActivityTimeline, ActivityLog } from '../../components/Tasks/ActivityTimeline';
import { CreateTaskForm } from '../../components/Tasks/CreateTaskForm';
import { StatusDropdown } from '../../components/Tasks/StatusDropdown';

// Create a Grid component that supports both old and new API
const Grid = (props: GridProps & { 
  size?: { xs?: number | boolean; sm?: number | boolean; md?: number | boolean; lg?: number | boolean };
  item?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
}) => {
  // If using new size prop, convert to old props for compatibility
  if (props.size) {
    const { size, ...rest } = props;
    return <MuiGrid component="div" {...rest} xs={size.xs} sm={size.sm} md={size.md} lg={size.lg} />;
  }
  // If using old item prop, use component="div"
  if (props.item) {
    return <MuiGrid component="div" {...props} />;
  }
  return <MuiGrid {...props} />;
};

interface TaskDetail {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  created_by_name?: string;
  created_by_email?: string;
  created_at?: string;
  updated_at?: string;
  comments: Comment[];
  files: TaskFile[];
  activityLogs: ActivityLog[];
}

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    loadTask();
    loadUsers();
  }, [id]);

  const loadTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiService.getTaskById(parseInt(id));
      if (response.success) {
        setTask(response.data);
        setNewStatus(response.data.status);
      } else {
        setError(response.message || 'Failed to load task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getTaskUsers();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!id) return;
    try {
      await apiService.updateTask(parseInt(id), taskData);
      setEditDialogOpen(false);
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async () => {
    if (!id) return;
    try {
      await apiService.updateTaskStatus(parseInt(id), newStatus);
      setStatusDialogOpen(false);
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleReassign = async () => {
    if (!id || !newAssignee) return;
    try {
      await apiService.reassignTask(parseInt(id), parseInt(newAssignee));
      setReassignDialogOpen(false);
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign task');
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!id) return;
    try {
      await apiService.addTaskComment(parseInt(id), comment);
      loadTask();
    } catch (err: any) {
      throw err;
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!id) return;
    try {
      await apiService.uploadTaskFile(parseInt(id), file);
      loadTask();
    } catch (err: any) {
      throw err;
    }
  };

  const handleCloseTask = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to close this task?')) return;
    try {
      await apiService.closeTask(parseInt(id));
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to close task');
    }
  };

  const handleReopenTask = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to reopen this task?')) return;
    try {
      await apiService.reopenTask(parseInt(id));
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen task');
    }
  };

  const canEdit = userRole === 'hr' || userRole === 'admin';
  const canReassign = userRole === 'hr' || userRole === 'admin';
  const canClose = userRole === 'hr' || userRole === 'admin';
  const canReopen = userRole === 'admin';
  const canChangeStatus = true; // All users can change status of their tasks

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !task) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Task not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  const isOverdue = !!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CLOSED');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={3}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      {/* Task Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              {task.title}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <TaskStatusBadge status={task.status as any} />
              <PriorityLabel priority={task.priority as any} />
              {task.deadline && (
                <DeadlineChip deadline={task.deadline} isOverdue={isOverdue} />
              )}
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
              >
                Edit
              </Button>
            )}
            {canClose && task.status !== 'CLOSED' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={handleCloseTask}
              >
                Close
              </Button>
            )}
            {canReopen && task.status === 'CLOSED' && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<RefreshIcon />}
                onClick={handleReopenTask}
              >
                Reopen
              </Button>
            )}
          </Box>
        </Box>

        {task.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {task.description}
          </Typography>
        )}

        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Assigned To:</strong> {task.assigned_to_name || task.assigned_to_email}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Created By:</strong> {task.created_by_name || task.created_by_email}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Created:</strong> {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Last Updated:</strong> {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          {canChangeStatus && (
            <Button
              variant="contained"
              onClick={() => setStatusDialogOpen(true)}
            >
              Change Status
            </Button>
          )}
          {canReassign && (
            <Button
              variant="outlined"
              onClick={() => setReassignDialogOpen(true)}
            >
              Reassign Task
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <CommentBox
            comments={task.comments}
            onAddComment={handleAddComment}
            currentUserName={task.assigned_to_name}
            currentUserEmail={task.assigned_to_email}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FileUploadButton
            files={task.files}
            onUpload={handleFileUpload}
          />
        </Grid>
        <Grid item xs={12}>
          <ActivityTimeline activities={task.activityLogs} />
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <CreateTaskForm
            mode="edit"
            initialData={{
              title: task.title,
              description: task.description,
              priority: task.priority as any,
              deadline: task.deadline,
            }}
            users={users}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Change Task Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <StatusDropdown
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              allowedStatuses={
                userRole === 'admin'
                  ? ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED']
                  : ['PENDING', 'IN_PROGRESS', 'COMPLETED']
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialogOpen} onClose={() => setReassignDialogOpen(false)}>
        <DialogTitle>Reassign Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={newAssignee}
                label="Assign To"
                onChange={(e) => setNewAssignee(e.target.value)}
                sx={{
                  '& .MuiSelect-select': {
                    paddingLeft: '20px !important',
                    paddingRight: '40px !important',
                    paddingTop: '14px !important',
                    paddingBottom: '14px !important',
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    '@media (max-width:600px)': {
                      paddingLeft: '16px !important',
                      paddingRight: '32px !important',
                      paddingTop: '10px !important',
                      paddingBottom: '10px !important',
                    },
                  },
                }}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReassign} variant="contained" disabled={!newAssignee}>
            Reassign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

