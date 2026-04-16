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
  InputLabel,
  Select,
  MenuItem,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface Qualification {
  id: number;
  name: string;
  description: string;
  level: string;
  isActive: boolean;
}

const QualificationList: React.FC = () => {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const qualificationLevels = [
    'Primary',
    'Secondary',
    'Higher Secondary',
    'Diploma',
    'Undergraduate',
    'Postgraduate',
    'Doctorate',
    'Professional',
  ];

  useEffect(() => {
    loadQualifications();
  }, []);

  const loadQualifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getQualifications();
      setQualifications(response.data || []);
    } catch (error) {
      console.error('Error loading qualifications:', error);
      setSnackbar({ open: true, message: 'Failed to load qualifications', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingQualification(null);
    setFormData({
      name: '',
      description: '',
      level: '',
      isActive: true,
    });
    setOpen(true);
  };

  const handleEdit = (qualification: Qualification) => {
    setEditingQualification(qualification);
    setFormData({
      name: qualification.name,
      description: qualification.description,
      level: qualification.level,
      isActive: qualification.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingQualification) {
        await apiService.updateQualification(editingQualification.id!, formData);
        setSnackbar({ open: true, message: 'Qualification updated successfully', severity: 'success' });
      } else {
        await apiService.createQualification(formData);
        setSnackbar({ open: true, message: 'Qualification created successfully', severity: 'success' });
      }
      setOpen(false);
      loadQualifications();
    } catch (error) {
      console.error('Error saving qualification:', error);
      setSnackbar({ open: true, message: 'Failed to save qualification', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this qualification?')) {
      try {
        await apiService.deleteQualification(id);
        setSnackbar({ open: true, message: 'Qualification deleted successfully', severity: 'success' });
        loadQualifications();
      } catch (error) {
        console.error('Error deleting qualification:', error);
        setSnackbar({ open: true, message: 'Failed to delete qualification', severity: 'error' });
      }
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'Primary': 'default',
      'Secondary': 'primary',
      'Higher Secondary': 'secondary',
      'Diploma': 'info',
      'Undergraduate': 'success',
      'Postgraduate': 'warning',
      'Doctorate': 'error',
      'Professional': 'default',
    };
    return colors[level] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Qualifications
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Add Qualification
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qualifications.map((qualification) => (
                <TableRow key={qualification.id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{qualification.name}</TableCell>
                  <TableCell>{qualification.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={qualification.level}
                      color={getLevelColor(qualification.level)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={qualification.isActive ? 'Active' : 'Inactive'}
                      color={qualification.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(qualification)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(qualification.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {qualifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No qualifications found. Click "Add Qualification" to create one.
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
          {editingQualification ? 'Edit Qualification' : 'Add New Qualification'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Qualification Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Bachelor of Engineering, MBA"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Provide details about this educational qualification (e.g., 4-year undergraduate degree in engineering with specializations in various fields)"
              helperText="Describe the qualification type, duration, specializations, and academic level"
            />
            <FormControl fullWidth required>
              <InputLabel>Level</InputLabel>
              <Select
                value={formData.level}
                label="Level"
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                {qualificationLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
            {editingQualification ? 'Update' : 'Create'}
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

export default QualificationList;
