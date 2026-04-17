// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as DepartmentIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      setSnackbar({ open: true, message: 'Failed to load departments', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true,
    });
    setOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
    });
    setOpen(true);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Department name is required');
    if (!formData.code.trim()) errors.push('Department code is required');
    if (formData.name.length < 2) errors.push('Department name must be at least 2 characters');
    if (formData.code.length < 2) errors.push('Department code must be at least 2 characters');

    // Check for duplicate code (excluding current department when editing)
    const duplicateCode = departments.find(dept =>
      dept.code?.toLowerCase() === formData.code?.toLowerCase() &&
      (!editingDepartment || dept.id !== editingDepartment.id)
    );
    if (duplicateCode) {
      errors.push('Department code already exists');
    }

    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSnackbar({
        open: true,
        message: 'Please fix the following errors:\n' + validationErrors.join('\n'),
        severity: 'error'
      });
      return;
    }

    try {
      if (editingDepartment) {
        await apiService.updateDepartment(editingDepartment.id!, formData);
        setSnackbar({ open: true, message: 'Department updated successfully', severity: 'success' });
      } else {
        await apiService.createDepartment(formData);
        setSnackbar({ open: true, message: 'Department created successfully', severity: 'success' });
      }
      setOpen(false);
      loadDepartments();
    } catch (error: any) {
      console.error('Error saving department:', error);
      if (error.response && error.response.data) {
        console.error('API response error data:', error.response.data);
      }
      setSnackbar({ open: true, message: 'Failed to save department: ' + (error.response?.data?.message || error.message || 'Unknown error'), severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        await apiService.deleteDepartment(id);
        setSnackbar({ open: true, message: 'Department deleted successfully', severity: 'success' });
        loadDepartments();
      } catch (error: any) {
        console.error('Error deleting department:', error);
        if (error.response && error.response.data) {
          console.error('API response error data:', error.response.data);
        }
        setSnackbar({ open: true, message: 'Failed to delete department: ' + (error.response?.data?.message || error.message || 'It may be in use by employees.'), severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DepartmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Department Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Add Department
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {department.code}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'medium' }}>{department.name}</TableCell>
                  <TableCell>{department.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={department.isActive ? 'Active' : 'Inactive'}
                      color={department.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(department)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(department.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No departments found. Click "Add Department" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Department Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              required
              placeholder="e.g., HR, IT, FIN"
              helperText="Unique code for the department"
            />
            <TextField
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Human Resources, Information Technology"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter the purpose and responsibilities of this department (e.g., Manages employee relations, recruitment, training, and HR policies)"
              helperText="Describe the department's role, responsibilities, and key functions"
            />

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Status</FormLabel>
              <RadioGroup
                row
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
              >
                <FormControlLabel
                  value="active"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Active</Typography>
                      <Chip label="Visible" size="small" color="success" />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="inactive"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Inactive</Typography>
                      <Chip label="Hidden" size="small" color="default" />
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingDepartment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DepartmentList;
