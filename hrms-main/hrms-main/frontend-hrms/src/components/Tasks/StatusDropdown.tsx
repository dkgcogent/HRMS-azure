import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

interface StatusDropdownProps {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  allowedStatuses?: string[];
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  onChange,
  allowedStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
  label = 'Status',
  fullWidth = true,
  size = 'medium',
}) => {
  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ].filter(option => allowedStatuses.includes(option.value));

  return (
    <FormControl fullWidth={fullWidth} size={size}>
      <InputLabel id="status-select-label">{label}</InputLabel>
      <Select
        labelId="status-select-label"
        id="status-select"
        value={value}
        label={label}
        onChange={onChange}
        sx={{
          '& .MuiSelect-select': {
            paddingLeft: '20px !important',
            paddingRight: '40px !important',
            paddingTop: size === 'small' ? '8px !important' : '14px !important',
            paddingBottom: size === 'small' ? '8px !important' : '14px !important',
            overflow: 'visible !important',
            textOverflow: 'clip !important',
            whiteSpace: 'nowrap !important',
            '@media (max-width:600px)': {
              paddingLeft: '16px !important',
              paddingRight: '32px !important',
              paddingTop: size === 'small' ? '6px !important' : '10px !important',
              paddingBottom: size === 'small' ? '6px !important' : '10px !important',
            },
          },
        }}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

