// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  Snackbar,
  Divider,
  Switch,
  FormControlLabel,
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
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Policy as PolicyIcon,
  Visibility as ViewIcon,
  CheckCircle as AcceptIcon,
  Schedule as PendingIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface HRPolicy {
  id?: number;
  title: string;
  category: string;
  description: string;
  content: string;
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  isMandatory: boolean;
  requiresAcknowledgment: boolean;
  targetAudience: 'ALL' | 'DEPARTMENT' | 'DESIGNATION' | 'SPECIFIC';
  targetDepartments?: number[];
  targetDesignations?: number[];
  targetEmployees?: number[];
  createdBy: number;
  approvedBy?: number;
  approvalDate?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
}

interface PolicyAcknowledgment {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  acknowledgedDate?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'OVERDUE';
  remindersSent: number;
}

const policyCategories = [
  'Code of Conduct',
  'Leave Policy',
  'Attendance Policy',
  'Compensation & Benefits',
  'Performance Management',
  'Training & Development',
  'Health & Safety',
  'IT & Security',
  'Disciplinary Actions',
  'Grievance Handling',
  'Anti-Harassment',
  'Confidentiality',
  'Travel Policy',
  'Expense Policy',
  'Other'
];

const HRPolicyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [acknowledgments, setAcknowledgments] = useState<PolicyAcknowledgment[]>([]);
  const [acknowledgmentDialog, setAcknowledgmentDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [policy, setPolicy] = useState<HRPolicy>({
    title: '',
    category: '',
    description: '',
    content: '',
    version: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: true,
    isMandatory: false,
    requiresAcknowledgment: false,
    targetAudience: 'ALL',
    createdBy: 1, // Current user ID
    status: 'DRAFT',
  });

  useEffect(() => {
    loadMasterData();
    if (isEdit && id) {
      loadPolicy(parseInt(id));
      loadAcknowledgments(parseInt(id));
    }
  }, [isEdit, id]);

  const loadMasterData = async () => {
    try {
      // In real app: Load from API
      setDepartments([
        { id: 1, name: 'Human Resources' },
        { id: 2, name: 'Information Technology' },
        { id: 3, name: 'Finance' },
      ]);
      setDesignations([
        { id: 1, name: 'Manager' },
        { id: 2, name: 'Senior Executive' },
        { id: 3, name: 'Executive' },
      ]);
      setEmployees([
        { id: 1, name: 'John Doe', department: 'IT' },
        { id: 2, name: 'Jane Smith', department: 'HR' },
      ]);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadPolicy = async (policyId: number) => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getPolicyById(policyId);
      // Mock data for demonstration
    } catch (error) {
      console.error('Error loading policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAcknowledgments = async (policyId: number) => {
    try {
      // In real app: const response = await apiService.getPolicyAcknowledgments(policyId);
      // Mock data
      const mockAcknowledgments: PolicyAcknowledgment[] = [
        {
          id: 1,
          employeeId: 1,
          employeeName: 'John Doe',
          departmentName: 'Information Technology',
          acknowledgedDate: '2024-04-01',
          status: 'ACKNOWLEDGED',
          remindersSent: 0,
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Jane Smith',
          departmentName: 'Human Resources',
          status: 'PENDING',
          remindersSent: 2,
        },
        {
          id: 3,
          employeeId: 3,
          employeeName: 'Mike Johnson',
          departmentName: 'Finance',
          status: 'OVERDUE',
          remindersSent: 3,
        },
      ];
      setAcknowledgments(mockAcknowledgments);
    } catch (error) {
      console.error('Error loading acknowledgments:', error);
    }
  };

  const handleInputChange = (field: keyof HRPolicy) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: 'targetDepartments' | 'targetDesignations' | 'targetEmployees') => (
    event: any
  ) => {
    const value = event.target.value as number[];
    setPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!policy.title.trim()) errors.push('Policy Title is required');
    if (!policy.category) errors.push('Category is required');
    if (!policy.description.trim()) errors.push('Description is required');
    if (!policy.content.trim()) errors.push('Policy Content is required');
    if (!policy.effectiveDate) errors.push('Effective Date is required');
    if (!policy.version.trim()) errors.push('Version is required');

    if (policy.expiryDate && policy.effectiveDate) {
      if (new Date(policy.expiryDate) <= new Date(policy.effectiveDate)) {
        errors.push('Expiry Date must be after Effective Date');
      }
    }

    if (policy.targetAudience === 'DEPARTMENT' && (!policy.targetDepartments || policy.targetDepartments.length === 0)) {
      errors.push('Please select target departments');
    }

    if (policy.targetAudience === 'DESIGNATION' && (!policy.targetDesignations || policy.targetDesignations.length === 0)) {
      errors.push('Please select target designations');
    }

    if (policy.targetAudience === 'SPECIFIC' && (!policy.targetEmployees || policy.targetEmployees.length === 0)) {
      errors.push('Please select target employees');
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      if (isEdit && id) {
        // await apiService.updatePolicy(parseInt(id), policy);
        setSnackbar({ open: true, message: 'Policy updated successfully!', severity: 'success' });
      } else {
        // await apiService.createPolicy(policy);
        setSnackbar({ open: true, message: 'Policy created successfully!', severity: 'success' });
      }
      setTimeout(() => navigate('/policies'), 1500);
    } catch (error) {
      console.error('Error saving policy:', error);
      setSnackbar({ open: true, message: 'Error saving policy. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/policies');
  };

  const sendReminders = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.sendPolicyReminders(id);
      setSnackbar({ open: true, message: 'Reminders sent successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error sending reminders:', error);
      setSnackbar({ open: true, message: 'Error sending reminders', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACKNOWLEDGED': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const acknowledgedCount = acknowledgments.filter(a => a.status === 'ACKNOWLEDGED').length;
  const totalCount = acknowledgments.length;
  const acknowledgmentRate = totalCount > 0 ? (acknowledgedCount / totalCount) * 100 : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit HR Policy' : 'Create HR Policy'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage HR policies with employee acknowledgment tracking.
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PolicyIcon />
                Policy Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 8
              }}>
              <TextField
                fullWidth
                label="Policy Title"
                required
                value={policy.title}
                onChange={handleInputChange('title')}
                placeholder="e.g., Remote Work Policy"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={policy.category}
                  label="Category"
                  onChange={handleInputChange('category')}
                >
                  {policyCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                required
                value={policy.description}
                onChange={handleInputChange('description')}
                placeholder="Brief description of the policy..."
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Policy Content"
                multiline
                rows={8}
                required
                value={policy.content}
                onChange={handleInputChange('content')}
                placeholder="Enter the complete policy content here..."
              />
            </Grid>

            {/* Version & Dates */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Version & Validity
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Version"
                required
                value={policy.version}
                onChange={handleInputChange('version')}
                placeholder="e.g., 1.0, 2.1"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                required
                value={policy.effectiveDate}
                onChange={handleInputChange('effectiveDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Expiry Date (Optional)"
                type="date"
                value={policy.expiryDate || ''}
                onChange={handleInputChange('expiryDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={policy.status}
                  label="Status"
                  onChange={handleInputChange('status')}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Target Audience */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Target Audience
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={policy.targetAudience}
                  label="Target Audience"
                  onChange={handleInputChange('targetAudience')}
                >
                  <MenuItem value="ALL">All Employees</MenuItem>
                  <MenuItem value="DEPARTMENT">Specific Departments</MenuItem>
                  <MenuItem value="DESIGNATION">Specific Designations</MenuItem>
                  <MenuItem value="SPECIFIC">Specific Employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {policy.targetAudience === 'DEPARTMENT' && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth>
                  <InputLabel>Target Departments</InputLabel>
                  <Select
                    multiple
                    value={policy.targetDepartments || []}
                    onChange={handleArrayChange('targetDepartments')}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => {
                          const dept = departments.find(d => d.id === value);
                          return <Chip key={value} label={dept?.name} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {policy.targetAudience === 'DESIGNATION' && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth>
                  <InputLabel>Target Designations</InputLabel>
                  <Select
                    multiple
                    value={policy.targetDesignations || []}
                    onChange={handleArrayChange('targetDesignations')}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => {
                          const desig = designations.find(d => d.id === value);
                          return <Chip key={value} label={desig?.name} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {designations.map((desig) => (
                      <MenuItem key={desig.id} value={desig.id}>
                        {desig.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {policy.targetAudience === 'SPECIFIC' && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth>
                  <InputLabel>Target Employees</InputLabel>
                  <Select
                    multiple
                    value={policy.targetEmployees || []}
                    onChange={handleArrayChange('targetEmployees')}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => {
                          const emp = employees.find(e => e.id === value);
                          return <Chip key={value} label={emp?.name} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Policy Settings */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Policy Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.isActive}
                      onChange={handleInputChange('isActive')}
                    />
                  }
                  label="Active Policy"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.isMandatory}
                      onChange={handleInputChange('isMandatory')}
                    />
                  }
                  label="Mandatory Policy"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.requiresAcknowledgment}
                      onChange={handleInputChange('requiresAcknowledgment')}
                    />
                  }
                  label="Requires Employee Acknowledgment"
                />
              </Box>
            </Grid>

            {/* Acknowledgment Tracking */}
            {isEdit && policy.requiresAcknowledgment && acknowledgments.length > 0 && (
              <>
                <Grid size={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Acknowledgment Tracking
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 8
                  }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Acknowledgment Progress
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={acknowledgmentRate}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2">
                          {acknowledgedCount}/{totalCount} ({Math.round(acknowledgmentRate)}%)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip label={`Acknowledged: ${acknowledgedCount}`} color="success" size="small" />
                        <Chip label={`Pending: ${acknowledgments.filter(a => a.status === 'PENDING').length}`} color="warning" size="small" />
                        <Chip label={`Overdue: ${acknowledgments.filter(a => a.status === 'OVERDUE').length}`} color="error" size="small" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => setAcknowledgmentDialog(true)}
                      fullWidth
                    >
                      View Details
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={sendReminders}
                      disabled={loading}
                      fullWidth
                    >
                      Send Reminders
                    </Button>
                  </Box>
                </Grid>
              </>
            )}

            <Grid size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEdit ? 'Update Policy' : 'Create Policy'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      {/* Acknowledgment Details Dialog */}
      <Dialog open={acknowledgmentDialog} onClose={() => setAcknowledgmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Policy Acknowledgment Details</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Acknowledged Date</TableCell>
                  <TableCell>Reminders Sent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {acknowledgments.map((ack) => (
                  <TableRow key={ack.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {ack.employeeName.charAt(0)}
                        </Avatar>
                        {ack.employeeName}
                      </Box>
                    </TableCell>
                    <TableCell>{ack.departmentName}</TableCell>
                    <TableCell>
                      <Chip
                        label={ack.status}
                        color={getStatusColor(ack.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {ack.acknowledgedDate ? new Date(ack.acknowledgedDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{ack.remindersSent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcknowledgmentDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ whiteSpace: 'pre-line' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HRPolicyForm;
