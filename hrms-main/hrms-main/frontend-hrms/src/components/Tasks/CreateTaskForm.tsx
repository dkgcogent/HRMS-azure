import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid as MuiGrid,
  GridProps,
  Paper,
  Typography,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { ResponsiveDropdown } from '../Common';

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

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CreateTaskFormProps {
  onSubmit: (taskData: {
    title: string;
    description?: string;
    assignedTo: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: string;
  }) => Promise<void>;
  onCancel: () => void;
  users?: User[];
  initialData?: {
    title?: string;
    description?: string;
    assignedTo?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: string;
  };
  mode?: 'create' | 'edit';
}

export const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  onSubmit,
  onCancel,
  users = [],
  initialData,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignedTo: initialData?.assignedTo || '',
    priority: initialData?.priority || 'MEDIUM',
    deadline: initialData?.deadline || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Please assign the task to someone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignedTo: parseInt(formData.assignedTo as string),
        priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        deadline: formData.deadline || undefined,
      });
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {mode === 'create' ? 'Create New Task' : 'Edit Task'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={!!errors.title}
              helperText={errors.title}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ResponsiveDropdown
              label="Assign To"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              options={users.map((user) => ({
                value: user.id,
                label: `${user.name} (${user.email}) - ${user.role}`,
              }))}
              required
              error={!!errors.assignedTo}
              helperText={errors.assignedTo}
              placeholder="Select an employee"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ResponsiveDropdown
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              placeholder="Select priority"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="date"
              label="Deadline"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

