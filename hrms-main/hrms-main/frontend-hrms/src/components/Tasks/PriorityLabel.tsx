import React from 'react';
import { Chip } from '@mui/material';

interface PriorityLabelProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  size?: 'small' | 'medium';
}

export const PriorityLabel: React.FC<PriorityLabelProps> = ({
  priority,
  size = 'small',
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'LOW':
        return '#4caf50';
      case 'MEDIUM':
        return '#2196f3';
      case 'HIGH':
        return '#ff9800';
      case 'URGENT':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'LOW':
        return 'Low';
      case 'MEDIUM':
        return 'Medium';
      case 'HIGH':
        return 'High';
      case 'URGENT':
        return 'Urgent';
      default:
        return priority;
    }
  };

  return (
    <Chip
      label={getPriorityLabel()}
      size={size}
      sx={{
        backgroundColor: getPriorityColor(),
        color: 'white',
        fontWeight: 600,
        '& .MuiChip-label': {
          color: 'white',
        },
      }}
    />
  );
};

