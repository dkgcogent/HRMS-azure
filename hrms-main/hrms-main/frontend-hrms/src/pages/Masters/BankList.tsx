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
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface Bank {
  id: number;
  name: string;
  ifscCode: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
}

const BankList: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ifscCode: '',
    branchName: '',
    address: '',
    city: '',
    state: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBanks();
      setBanks(response.data || []);
    } catch (error) {
      console.error('Error loading banks:', error);
      setSnackbar({ open: true, message: 'Failed to load banks', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBank(null);
    setFormData({
      name: '',
      ifscCode: '',
      branchName: '',
      address: '',
      isActive: true,
    });
    setOpen(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      ifscCode: bank.ifscCode,
      branchName: bank.branchName,
      address: bank.address,
      city: bank.city || '',
      state: bank.state || '',
      isActive: bank.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingBank) {
        await apiService.updateBank(editingBank.id!, formData);
        setSnackbar({ open: true, message: 'Bank updated successfully', severity: 'success' });
      } else {
        await apiService.createBank(formData);
        setSnackbar({ open: true, message: 'Bank created successfully', severity: 'success' });
      }
      setOpen(false);
      loadBanks();
    } catch (error) {
      console.error('Error saving bank:', error);
      setSnackbar({ open: true, message: 'Failed to save bank', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      try {
        await apiService.deleteBank(id);
        setSnackbar({ open: true, message: 'Bank deleted successfully', severity: 'success' });
        loadBanks();
      } catch (error) {
        console.error('Error deleting bank:', error);
        setSnackbar({ open: true, message: 'Failed to delete bank', severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BankIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Banks Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Add Bank
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Bank Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>IFSC Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Branch Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banks.map((bank) => (
                <TableRow key={bank.id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{bank.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {bank.ifscCode}
                    </Typography>
                  </TableCell>
                  <TableCell>{bank.branchName}</TableCell>
                  <TableCell>{bank.address}</TableCell>
                  <TableCell>
                    <Chip
                      label={bank.isActive ? 'Active' : 'Inactive'}
                      color={bank.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(bank)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(bank.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {banks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No banks found. Click "Add Bank" to create one.
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
          {editingBank ? 'Edit Bank' : 'Add New Bank'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Bank Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="IFSC Code"
              value={formData.ifscCode}
              onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
              fullWidth
              required
              placeholder="e.g., SBIN0001234"
            />
            <TextField
              label="Branch Name"
              value={formData.branchName}
              onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
              required
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              fullWidth
            />
            <TextField
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              fullWidth
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
            {editingBank ? 'Update' : 'Create'}
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

export default BankList;
