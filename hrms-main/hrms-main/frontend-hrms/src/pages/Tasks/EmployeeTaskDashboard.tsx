import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid as MuiGrid,
  GridProps,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { TaskCard, Task } from '../../components/Tasks/TaskCard';
import { DashboardStatCard } from '../../components/Tasks/DashboardStatCard';

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

export const EmployeeTaskDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [statusFilter, priorityFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getMyTasks({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      
      if (response.success) {
        setTasks(response.data || []);
      } else {
        setError(response.message || 'Failed to load tasks');
      }
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load tasks. Please ensure the database tables are created.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getTaskStats();
      if (response.success) {
        setStats(response.data || stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // Set default stats if error occurs
      setStats({
        pending: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
      });
    }
  };

  const handleTaskClick = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          My Tasks
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="Pending"
            value={stats.pending}
            type="pending"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="In Progress"
            value={stats.inProgress}
            type="inProgress"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="Completed"
            value={stats.completed}
            type="completed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStatCard
            title="Total Tasks"
            value={stats.total}
            type="total"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Box mb={3} p={2} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <FilterIcon color="action" />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  paddingLeft: '20px !important',
                  paddingRight: '40px !important',
                  paddingTop: '8px !important',
                  paddingBottom: '8px !important',
                  overflow: 'visible !important',
                  textOverflow: 'clip !important',
                  whiteSpace: 'nowrap !important',
                  '@media (max-width:600px)': {
                    paddingLeft: '16px !important',
                    paddingRight: '32px !important',
                    paddingTop: '6px !important',
                    paddingBottom: '6px !important',
                  },
                },
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="URGENT">Urgent</MenuItem>
            </Select>
          </FormControl>
          {(statusFilter || priorityFilter) && (
            <Button variant="outlined" size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tasks List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusFilter || priorityFilter
              ? 'Try adjusting your filters'
              : 'You have no tasks assigned to you'}
          </Typography>
        </Box>
      ) : (
        <Box>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => handleTaskClick(task.id)}
              showAssignee={false}
            />
          ))}
        </Box>
      )}
    </Container>
  );
};

