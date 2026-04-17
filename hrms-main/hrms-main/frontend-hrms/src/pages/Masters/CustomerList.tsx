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
    Person as CustomerIcon,
} from '@mui/icons-material';
import { apiService, Customer } from '../../services/api';

const CustomerList: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        isActive: true,
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await apiService.getCustomers();
            setCustomers(response.data || []);
        } catch (error) {
            console.error('Error loading customers:', error);
            setSnackbar({ open: true, message: 'Failed to load customers', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCustomer(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            isActive: true,
        });
        setOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            code: customer.code || '',
            description: customer.description || '',
            isActive: customer.isActive ?? true,
        });
        setOpen(true);
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!formData.name.trim()) errors.push('Customer name is required');
        if (formData.name.length < 2) errors.push('Customer name must be at least 2 characters');

        // Check for duplicate name or code
        const duplicate = customers.find(customer =>
            ((customer.name || '').toLowerCase() === (formData.name || '').toLowerCase() ||
            (formData.code && (customer.code || '').toLowerCase() === (formData.code || '').toLowerCase())) &&
            (!editingCustomer || customer.id !== editingCustomer.id)
        );

        if (duplicate) {
            if ((duplicate.name || '').toLowerCase() === (formData.name || '').toLowerCase()) {
                errors.push('Customer name already exists');
            }
            if (formData.code && (duplicate.code || '').toLowerCase() === (formData.code || '').toLowerCase()) {
                errors.push('Customer code already exists');
            }
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
            if (editingCustomer) {
                await apiService.updateCustomer(editingCustomer.id!, formData);
                setSnackbar({ open: true, message: 'Customer updated successfully', severity: 'success' });
            } else {
                await apiService.createCustomer(formData);
                setSnackbar({ open: true, message: 'Customer created successfully', severity: 'success' });
            }
            setOpen(false);
            loadCustomers();
        } catch (error: any) {
            console.error('Error saving customer:', error);
            setSnackbar({ open: true, message: 'Failed to save customer: ' + (error.response?.data?.message || error.message || 'Unknown error'), severity: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            try {
                await apiService.deleteCustomer(id);
                setSnackbar({ open: true, message: 'Customer deleted successfully', severity: 'success' });
                loadCustomers();
            } catch (error: any) {
                console.error('Error deleting customer:', error);
                setSnackbar({ open: true, message: 'Failed to delete customer: ' + (error.response?.data?.message || error.message || 'It may be in use.'), severity: 'error' });
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CustomerIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Customer Management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    sx={{ borderRadius: 2 }}
                >
                    Add Customer
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
                            {customers.map((customer) => (
                                <TableRow key={customer.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {customer.code || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'medium' }}>{customer.name}</TableCell>
                                    <TableCell>{customer.description}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={customer.isActive ? 'Active' : 'Inactive'}
                                            color={customer.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(customer)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(customer.id!)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {customers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            No customers found. Click "Add Customer" to create one.
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
                    {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Customer Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            fullWidth
                            placeholder="e.g., CUST001"
                            helperText="Optional unique code for the customer"
                        />
                        <TextField
                            label="Customer Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                            placeholder="e.g., Acme Corp"
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Enter customer details"
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
                                    label="Active"
                                />
                                <FormControlLabel
                                    value="inactive"
                                    control={<Radio />}
                                    label="Inactive"
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {editingCustomer ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

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

export default CustomerList;
