import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { TaskStatusBadge } from './TaskStatusBadge';
import { PriorityLabel } from './PriorityLabel';
import { DeadlineChip } from './DeadlineChip';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  showAssignee?: boolean;
  showCreator?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  showAssignee = true,
  showCreator = false,
}) => {
  const isOverdue = !!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CLOSED');

  return (
    <Card
      sx={{
        mb: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        } : {},
        borderLeft: `4px solid ${
          task.priority === 'URGENT' ? '#f44336' :
          task.priority === 'HIGH' ? '#ff9800' :
          task.priority === 'MEDIUM' ? '#2196f3' :
          '#4caf50'
        }`,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {task.title}
            </Typography>
            {task.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </Typography>
            )}
          </Box>
          {onClick && (
            <IconButton size="small" sx={{ ml: 1 }}>
              <ArrowIcon />
            </IconButton>
          )}
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" mb={1}>
          <TaskStatusBadge status={task.status} />
          <PriorityLabel priority={task.priority} />
          {task.deadline && (
            <DeadlineChip deadline={task.deadline} isOverdue={isOverdue} />
          )}
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mt={1.5}>
          {showAssignee && task.assigned_to_name && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {task.assigned_to_name}
              </Typography>
            </Box>
          )}
          {showCreator && task.created_by_name && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <TaskIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Created by: {task.created_by_name}
              </Typography>
            </Box>
          )}
          {task.created_at && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {new Date(task.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

