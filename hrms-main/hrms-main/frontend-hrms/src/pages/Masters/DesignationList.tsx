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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as DesignationIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

// Import types from API service
import { Designation as ApiDesignation, Department as ApiDepartment } from '../../services/api';

interface Designation extends ApiDesignation {
  departmentName?: string;
  level?: string;
}

interface Department extends ApiDepartment {
  // Additional properties if needed
}

const DesignationList: React.FC = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: 0,
    level: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const designationLevels = [
    'Entry Level',
    'Junior',
    'Senior',
    'Lead',
    'Manager',
    'Senior Manager',
    'Director',
    'Vice President',
    'President'
  ];

  useEffect(() => {
    loadDesignations();
    loadDepartments();
  }, []);

  const loadDesignations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDesignations();
      setDesignations(response.data || []);
    } catch (error) {
      console.error('Error loading designations:', error);
      setSnackbar({ open: true, message: 'Failed to load designations', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response.data?.filter((dept: Department) => dept.isActive !== false) || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      setSnackbar({ open: true, message: 'Failed to load departments', severity: 'error' });
    }
  };

  const handleAdd = () => {
    setEditingDesignation(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      departmentId: 0,
      level: '',
      isActive: true,
    });
    setOpen(true);
  };

  const handleEdit = (designation: Designation) => {
    setEditingDesignation(designation);
    setFormData({
      name: designation.name,
      code: designation.code || '',
      description: designation.description || '',
      departmentId: designation.departmentId,
      level: designation.level || '',
      isActive: designation.isActive ?? true,
    });
    setOpen(true);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Designation name is required');
    if (!formData.code.trim()) errors.push('Designation code is required');
    if (!formData.departmentId || formData.departmentId === 0) errors.push('Department is required');
    if (!formData.level) errors.push('Level is required');
    if (formData.name.length < 2) errors.push('Designation name must be at least 2 characters');
    if (formData.code.length < 2) errors.push('Designation code must be at least 2 characters');

    // Check for duplicate code within the same department
    const duplicateCode = designations.find(desig =>
      desig.code?.toLowerCase() === formData.code.toLowerCase() &&
      desig.departmentId === formData.departmentId &&
      (!editingDesignation || desig.id !== editingDesignation.id)
    );
    if (duplicateCode) {
      errors.push('Designation code already exists in this department');
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
      const payload = {
        ...formData,
        departmentId: formData.departmentId
      };

      if (editingDesignation) {
        await apiService.updateDesignation(editingDesignation.id!, payload);
        setSnackbar({ open: true, message: 'Designation updated successfully', severity: 'success' });
      } else {
        await apiService.createDesignation(payload);
        setSnackbar({ open: true, message: 'Designation created successfully', severity: 'success' });
      }
      setOpen(false);
      loadDesignations();
    } catch (error) {
      console.error('Error saving designation:', error);
      setSnackbar({ open: true, message: 'Failed to save designation', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this designation? This action cannot be undone.')) {
      try {
        await apiService.deleteDesignation(id);
        setSnackbar({ open: true, message: 'Designation deleted successfully', severity: 'success' });
        loadDesignations();
      } catch (error) {
        console.error('Error deleting designation:', error);
        setSnackbar({ open: true, message: 'Failed to delete designation. It may be in use by employees.', severity: 'error' });
      }
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'Entry Level': 'default',
      'Junior': 'primary',
      'Senior': 'secondary',
      'Lead': 'info',
      'Manager': 'success',
      'Senior Manager': 'warning',
      'Director': 'error',
      'Vice President': 'error',
      'President': 'error'
    };
    return colors[level] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DesignationIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Designation Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Add Designation
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {designations.map((designation) => (
                <TableRow key={designation.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {designation.code}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'medium' }}>{designation.name}</TableCell>
                  <TableCell>{designation.departmentName || 'Unknown Department'}</TableCell>
                  <TableCell>
                    <Chip
                      label={designation.level || 'Not specified'}
                      color={getLevelColor(designation.level || '')}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={designation.isActive ? 'Active' : 'Inactive'}
                      color={designation.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(designation)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(designation.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {designations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No designations found. Click "Add Designation" to create one.
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
          {editingDesignation ? 'Edit Designation' : 'Add New Designation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.departmentId === 0 ? '' : formData.departmentId}
                label="Department"
                onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value as string, 10) || 0 })}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Designation Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              required
              placeholder="e.g., MGR, ENG, LEAD"
              helperText="Unique code within the department"
            />

            <TextField
              label="Designation Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Software Engineer, HR Manager"
            />

            <FormControl fullWidth required>
              <InputLabel>Level</InputLabel>
              <Select
                value={formData.level}
                label="Level"
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                {designationLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the role, responsibilities, and reporting structure (e.g., Responsible for leading software development team, code reviews, and technical decisions)"
              helperText="Provide details about this designation's duties, required skills, and position in hierarchy"
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
            {editingDesignation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false }) }>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DesignationList;
