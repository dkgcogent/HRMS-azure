import React from 'react';
import { Chip } from '@mui/material';

interface TaskStatusBadgeProps {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  size?: 'small' | 'medium';
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  size = 'small',
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CLOSED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CLOSED':
        return 'Closed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Chip
      label={getStatusLabel()}
      color={getStatusColor() as any}
      size={size}
      sx={{
        fontWeight: 500,
      }}
    />
  );
};

