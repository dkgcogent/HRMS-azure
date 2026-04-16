import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid as MuiGrid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, LeaveApplication, LeaveType, Employee } from '../../services/api';

// Create a Grid component that always includes component="div" for Grid items
const Grid = (props: any) => {
  if (props.item) {
    return <MuiGrid component="div" {...props} />;
  }
  return <MuiGrid {...props} />;
};

const LeaveForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });
  const [masterDataLoading, setMasterDataLoading] = useState(false);

  const [leaveApplication, setLeaveApplication] = useState<LeaveApplication>({
    employeeId: 0,
    leaveTypeId: 0,
    startDate: '',
    endDate: '',
    reason: '',
    status: 'PENDING',
  });

  useEffect(() => {
    loadMasterData();
    if (isEdit && id) {
      loadLeaveApplication(parseInt(id));
    }
  }, [isEdit, id]);

  const loadMasterData = async () => {
    try {
      setMasterDataLoading(true);
      const [employeesRes, leaveTypesRes] = await Promise.all([
        apiService.getEmployees(0, 1000), // Assuming max 1000 employees for dropdown
        apiService.getLeaveTypes(),
      ]);
      setEmployees(employeesRes.data?.content || []);
      setLeaveTypes(leaveTypesRes.data || []);
    } catch (error) {
      console.error('Error loading master data:', error);
      setSnackbar({ open: true, message: 'Failed to load master data', severity: 'error' });
    } finally {
      setMasterDataLoading(false);
    }
  };

  const loadLeaveApplication = async (leaveId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getLeaveRequestById(leaveId);
      if (response.success) {
        setLeaveApplication(response.data);
      }
    } catch (error) {
      console.error('Error loading leave application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LeaveApplication) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<number>
  ) => {
    const value = event.target.value;
    setLeaveApplication(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!leaveApplication.employeeId) errors.push('Employee is required');
    if (!leaveApplication.leaveTypeId) errors.push('Leave Type is required');
    if (!leaveApplication.startDate) errors.push('Start Date is required');
    if (!leaveApplication.endDate) errors.push('End Date is required');
    if (!leaveApplication.reason.trim()) errors.push('Reason is required');
    if (leaveApplication.startDate && leaveApplication.endDate) {
      if (new Date(leaveApplication.startDate) > new Date(leaveApplication.endDate)) {
        errors.push('End Date must be after Start Date');
      }
    }
    return errors;
  };

  const validateMasterDataExists = () => {
    const errors: string[] = [];

    if (leaveApplication.employeeId && !employees.find(e => e.id === leaveApplication.employeeId)) {
      errors.push('Selected Employee does not exist. Please refresh the page and try again.');
    }

    if (leaveApplication.leaveTypeId && !leaveTypes.find(lt => lt.id === leaveApplication.leaveTypeId)) {
      errors.push('Selected Leave Type does not exist. Please refresh the page and try again.');
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateForm();
    const masterDataErrors = validateMasterDataExists();

    const allErrors = [...validationErrors, ...masterDataErrors];

    if (allErrors.length > 0) {
      setSnackbar({
        open: true,
        message: 'Please fix the following errors:\n' + allErrors.join('\n'),
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await apiService.updateLeaveRequestStatus(parseInt(id), leaveApplication.status!, leaveApplication.approvedBy!);
        setSnackbar({ open: true, message: 'Leave application updated successfully!', severity: 'success' });
      } else {
        await apiService.createLeaveRequest(leaveApplication);
        setSnackbar({ open: true, message: 'Leave application submitted successfully!', severity: 'success' });
      }
      setTimeout(() => navigate('/leave'), 1500);
    } catch (error: any) {
      console.error('Error saving leave application:', error);
      const errorMessage = error?.response?.data?.message || 'Error saving leave application. Please try again.';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/leave');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit Leave Application' : 'Apply for Leave'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Submit a leave application with the required details.
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel id="leave-employee-label" shrink={!!leaveApplication.employeeId || true}>Employee</InputLabel>
                <Select
                  labelId="leave-employee-label"
                  value={leaveApplication.employeeId ?? ''}
                  label="Employee"
                  onChange={handleInputChange('employeeId')}
                  disabled={masterDataLoading}
                  displayEmpty
                  renderValue={(selected: any) => {
                    if (!selected || selected === '' || selected === null || selected === undefined) {
                      return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>Select Employee</span>;
                    }
                    const emp = employees.find(e => e.id === selected);
                    return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeId})` : String(selected)}</span>;
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      paddingLeft: '20px !important',
                      paddingRight: '40px !important',
                      paddingTop: '14px !important',
                      paddingBottom: '14px !important',
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      width: '100% !important',
                      boxSizing: 'border-box',
                      '@media (max-width:600px)': {
                        paddingLeft: '16px !important',
                        paddingRight: '32px !important',
                        paddingTop: '10px !important',
                        paddingBottom: '10px !important',
                      },
                    },
                    '& .MuiSelect-select > span': {
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      maxWidth: 'none !important',
                      width: 'auto !important',
                    },
                  }}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel id="leave-type-label" shrink={!!leaveApplication.leaveTypeId || true}>Leave Type</InputLabel>
                <Select
                  labelId="leave-type-label"
                  value={leaveApplication.leaveTypeId || ''}
                  label="Leave Type"
                  onChange={handleInputChange('leaveTypeId') as any}
                  displayEmpty
                  renderValue={(selected: any) => {
                    if (!selected || selected === '' || selected === null || selected === undefined) {
                      return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>Select Leave Type</span>;
                    }
                    const type = leaveTypes.find(t => t.id === selected);
                    return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{type?.name || String(selected)}</span>;
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      paddingLeft: '20px !important',
                      paddingRight: '40px !important',
                      paddingTop: '14px !important',
                      paddingBottom: '14px !important',
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      width: '100% !important',
                      boxSizing: 'border-box',
                      '@media (max-width:600px)': {
                        paddingLeft: '16px !important',
                        paddingRight: '32px !important',
                        paddingTop: '10px !important',
                        paddingBottom: '10px !important',
                      },
                    },
                    '& .MuiSelect-select > span': {
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      maxWidth: 'none !important',
                      width: 'auto !important',
                    },
                  }}
                >
                  {leaveTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                required
                value={leaveApplication.startDate}
                onChange={handleInputChange('startDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                required
                value={leaveApplication.endDate}
                onChange={handleInputChange('endDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Reason for Leave"
                multiline
                rows={4}
                required
                value={leaveApplication.reason}
                onChange={handleInputChange('reason')}
                placeholder="Please provide a detailed reason for your leave application..."
              />
            </Grid>
            {isEdit && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="leave-status-label" shrink={!!leaveApplication.status || true}>Status</InputLabel>
                  <Select
                    labelId="leave-status-label"
                    value={leaveApplication.status || 'PENDING'}
                    label="Status"
                    onChange={handleInputChange('status') as any}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '') {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>Select Status</span>;
                      }
                      const statusLabels: { [key: string]: string } = {
                        'PENDING': 'Pending',
                        'APPROVED': 'Approved',
                        'REJECTED': 'Rejected',
                        'CANCELLED': 'Cancelled',
                      };
                      return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{statusLabels[selected] || selected}</span>;
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        paddingLeft: '20px !important',
                        paddingRight: '40px !important',
                        paddingTop: '14px !important',
                        paddingBottom: '14px !important',
                        overflow: 'visible !important',
                        textOverflow: 'clip !important',
                        whiteSpace: 'nowrap !important',
                        width: '100% !important',
                        boxSizing: 'border-box',
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                      '& .MuiSelect-select > span': {
                        overflow: 'visible !important',
                        textOverflow: 'clip !important',
                        whiteSpace: 'nowrap !important',
                        maxWidth: 'none !important',
                        width: 'auto !important',
                      },
                    }}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel}>Cancel</Button>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
                  {loading ? 'Saving...' : isEdit ? 'Update Application' : 'Submit Application'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled" sx={{ whiteSpace: 'pre-line' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveForm;