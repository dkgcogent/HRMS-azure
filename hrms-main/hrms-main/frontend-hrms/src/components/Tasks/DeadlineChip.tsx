import React from 'react';
import { Chip } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';

interface DeadlineChipProps {
  deadline: string;
  isOverdue?: boolean;
  size?: 'small' | 'medium';
}

export const DeadlineChip: React.FC<DeadlineChipProps> = ({
  deadline,
  isOverdue = false,
  size = 'small',
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Chip
      icon={<EventIcon />}
      label={formatDate(deadline)}
      size={size}
      color={isOverdue ? 'error' : 'default'}
      sx={{
        fontWeight: isOverdue ? 600 : 400,
      }}
    />
  );
};

