import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
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
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Work as ManpowerIcon,
} from '@mui/icons-material';
import { ManpowerType, apiService } from '../../services/api';

const ManpowerTypeList: React.FC = () => {
  const [manpowerTypes, setManpowerTypes] = useState<ManpowerType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // loading state is used in loadManpowerTypes to show/hide UI indicators
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManpowerType | null>(null);
  const [formData, setFormData] = useState<ManpowerType>({
    name: '',
    description: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  const loadManpowerTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getManpowerTypes();
      
      if (response && response.success && response.data) {
        setManpowerTypes(response.data);
      } else {
        // Handle unsuccessful response but not error
        setSnackbar({ 
          open: true, 
          message: response?.message || 'No manpower types found', 
          severity: 'warning' 
        });
        
        // Always provide fallback data to ensure UI is usable
        setManpowerTypes([
          { id: 1, name: 'Permanent', description: 'Permanent employees', isActive: true },
          { id: 2, name: 'Contract', description: 'Contract employees', isActive: true },
          { id: 3, name: 'Temporary', description: 'Temporary employees', isActive: true },
        ]);
      }
    } catch (error: any) {
      console.error('Error loading manpower types:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load manpower types';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      
      // Always provide fallback data to ensure UI is usable
      setManpowerTypes([
        { id: 1, name: 'Permanent', description: 'Permanent employees', isActive: true },
        { id: 2, name: 'Contract', description: 'Contract employees', isActive: true },
        { id: 3, name: 'Temporary', description: 'Temporary employees', isActive: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManpowerTypes();
  }, [loadManpowerTypes]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', isActive: true });
    setDialogOpen(true);
  };

  const handleEdit = (item: ManpowerType) => {
    setEditingItem(item);
    setFormData({ ...item });
    setDialogOpen(true);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Manpower type name is required');
    if (formData.name.length < 2) errors.push('Manpower type name must be at least 2 characters');

    // Check for duplicate name (excluding current item when editing)
    // Trim whitespace and normalize case for accurate comparison
    const normalizedNewName = (formData.name || '').trim().toLowerCase();
    const duplicateName = manpowerTypes.find(type => {
      const normalizedExistingName = (type.name || '').trim().toLowerCase();
      return normalizedExistingName === normalizedNewName &&
        (!editingItem || type.id !== editingItem.id);
    });
    
    if (duplicateName) {
      errors.push('Manpower type name already exists');
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
      setLoading(true);
      let response;
      if (editingItem && editingItem.id) {
        response = await apiService.updateManpowerType(editingItem.id, formData);
      } else {
        response = await apiService.createManpowerType(formData);
      }
      
      if (!response || !response.success) {
        // Enhanced error feedback with more specific messages
        let errorMessage = response?.message || 'Failed to save manpower type';
        
        // Add more context to the error message
        if (errorMessage.includes('already exists')) {
          errorMessage = `The manpower type "${formData.name}" already exists. Please use a different name.`;
        } else if (errorMessage.includes('server error')) {
          errorMessage = 'The server encountered an error. Please try again in a few moments.';
        }
        
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        return;
      }
      
      setSnackbar({ 
        open: true, 
        message: editingItem ? 'Manpower type updated successfully' : 'Manpower type created successfully', 
        severity: 'success' 
      });
      setDialogOpen(false);
      loadManpowerTypes();
    } catch (error) {
      console.error('Error saving manpower type:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save manpower type';
      setSnackbar({ 
        open: true, 
        message: `An unexpected error occurred: ${errorMessage}. Please try again.`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this manpower type?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiService.deleteManpowerType(id);
      if (response && response.success) {
        setSnackbar({ open: true, message: 'Manpower type deleted successfully', severity: 'success' });
        loadManpowerTypes();
      } else {
        // Enhanced error feedback with more specific messages
        let errorMessage = response?.message || 'Failed to delete manpower type';
        
        // Add more context to the error message
        if (errorMessage.includes('foreign key constraint')) {
          errorMessage = 'This manpower type cannot be deleted because it is being used by employees. Please remove all references before deleting.';
        } else if (errorMessage.includes('server error')) {
          errorMessage = 'The server encountered an error. Please try again in a few moments.';
        }
        
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      }
    } catch (error: any) {
      console.error('Error deleting manpower type:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete manpower type';
      setSnackbar({ 
        open: true, 
        message: `An unexpected error occurred: ${errorMessage}. Please try again.`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      setLoading(true);
      const manpowerType = manpowerTypes.find(type => type.id === id);
      if (!manpowerType) {
        setSnackbar({ open: true, message: 'Manpower type not found', severity: 'error' });
        return;
      }
      
      const newStatus = !currentStatus;
      const statusText = newStatus ? 'activate' : 'deactivate';
      const updatedType = { ...manpowerType, isActive: newStatus };
      const response = await apiService.updateManpowerType(id, updatedType);
      
      if (response && response.success) {
        setSnackbar({ open: true, message: `Manpower type ${newStatus ? 'activated' : 'deactivated'} successfully`, severity: 'success' });
        loadManpowerTypes();
      } else {
        let errorMessage = response?.message || `Failed to ${statusText} manpower type`;
        
        if (errorMessage.includes('server error')) {
          errorMessage = 'The server encountered an error. Please try again in a few moments.';
        }
        
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      }
    } catch (error: any) {
      console.error('Error updating manpower type status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update status';
      setSnackbar({ 
        open: true, 
        message: `An unexpected error occurred while updating status: ${errorMessage}. Please try again.`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ManpowerIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Manpower Types Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Add Manpower Type
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={24} />
                      <Typography>Loading manpower types...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                manpowerTypes.map((item) => 
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.isActive ? 'Active' : 'Inactive'}
                      color={item.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(item)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleStatus(item.id!, item.isActive || false)}
                      color={item.isActive ? 'warning' : 'success'}
                      sx={{ mr: 1 }}
                    >
                      {item.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item.id!)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
              }
              {manpowerTypes.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No manpower types found. Click "Add Manpower Type" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Manpower Type' : 'Add New Manpower Type'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Manpower Type Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Permanent, Contract, Temporary"
            />
            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Explain the employment type and its characteristics (e.g., Full-time permanent employees with benefits, job security, and long-term contracts)"
              helperText="Describe the nature of employment, benefits, contract duration, and key features"
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
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingItem ? 'Update' : 'Create'}
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

export default ManpowerTypeList;
