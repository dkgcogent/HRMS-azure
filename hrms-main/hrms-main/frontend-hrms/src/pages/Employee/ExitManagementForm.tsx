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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExitToApp as ExitIcon,
  Assignment as FormIcon,
  AccountBalance as FinanceIcon,
  Handshake as HandoverIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface ExitFormality {
  id: number;
  category: string;
  item: string;
  responsible: string;
  isCompleted: boolean;
  completedDate?: string;
  remarks?: string;
}

interface AssetHandover {
  id: number;
  assetType: string;
  assetName: string;
  assetId: string;
  condition: 'GOOD' | 'FAIR' | 'DAMAGED';
  isReturned: boolean;
  returnDate?: string;
  remarks?: string;
}

interface FFSettlement {
  component: string;
  amount: number;
  description: string;
  type: 'CREDIT' | 'DEBIT';
}

interface ExitProcess {
  id?: number;
  employeeId: number;
  employeeName?: string;
  resignationDate: string;
  lastWorkingDate: string;
  exitType: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'END_OF_CONTRACT';
  reason: string;
  noticePeriod: number;
  exitInterview: {
    conducted: boolean;
    conductedBy?: string;
    date?: string;
    feedback?: string;
    rating?: number;
  };
  formalities: ExitFormality[];
  assetHandovers: AssetHandover[];
  ffSettlement: {
    basicSalary: number;
    pendingSalary: number;
    leaveEncashment: number;
    gratuity: number;
    bonus: number;
    otherAllowances: number;
    deductions: number;
    netAmount: number;
    components: FFSettlement[];
  };
  status: 'INITIATED' | 'IN_PROGRESS' | 'PENDING_CLEARANCE' | 'COMPLETED';
  currentStep: number;
}

const exitTypes = [
  { value: 'RESIGNATION', label: 'Resignation' },
  { value: 'TERMINATION', label: 'Termination' },
  { value: 'RETIREMENT', label: 'Retirement' },
  { value: 'END_OF_CONTRACT', label: 'End of Contract' },
];

const defaultFormalities: ExitFormality[] = [
  { id: 1, category: 'HR', item: 'Exit Interview', responsible: 'HR Manager', isCompleted: false },
  { id: 2, category: 'HR', item: 'Final Settlement Calculation', responsible: 'HR Executive', isCompleted: false },
  { id: 3, category: 'IT', item: 'Laptop Return', responsible: 'IT Admin', isCompleted: false },
  { id: 4, category: 'IT', item: 'Access Card Return', responsible: 'Security', isCompleted: false },
  { id: 5, category: 'IT', item: 'Email Account Deactivation', responsible: 'IT Admin', isCompleted: false },
  { id: 6, category: 'Finance', item: 'Expense Settlement', responsible: 'Finance Team', isCompleted: false },
  { id: 7, category: 'Admin', item: 'Knowledge Transfer', responsible: 'Reporting Manager', isCompleted: false },
  { id: 8, category: 'Admin', item: 'Project Handover', responsible: 'Project Manager', isCompleted: false },
];

const ExitManagementForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [interviewDialog, setInterviewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [exitProcess, setExitProcess] = useState<ExitProcess>({
    employeeId: 0,
    resignationDate: '',
    lastWorkingDate: '',
    exitType: 'RESIGNATION',
    reason: '',
    noticePeriod: 30,
    exitInterview: {
      conducted: false,
    },
    formalities: defaultFormalities,
    assetHandovers: [],
    ffSettlement: {
      basicSalary: 0,
      pendingSalary: 0,
      leaveEncashment: 0,
      gratuity: 0,
      bonus: 0,
      otherAllowances: 0,
      deductions: 0,
      netAmount: 0,
      components: [],
    },
    status: 'INITIATED',
    currentStep: 0,
  });

  const steps = [
    'Exit Initiation',
    'Formalities Completion',
    'Asset Handover',
    'F&F Settlement',
    'Final Clearance'
  ];

  useEffect(() => {
    if (isEdit && id) {
      loadExitProcess(parseInt(id));
    }
  }, [isEdit, id]);

  const loadExitProcess = async (processId: number) => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getExitProcess(processId);
      // Mock data
      const mockProcess: ExitProcess = {
        id: processId,
        employeeId: 1,
        employeeName: 'John Doe',
        resignationDate: '2024-04-01',
        lastWorkingDate: '2024-05-01',
        exitType: 'RESIGNATION',
        reason: 'Better opportunity',
        noticePeriod: 30,
        exitInterview: {
          conducted: true,
          conductedBy: 'HR Manager',
          date: '2024-04-25',
          feedback: 'Good experience overall, suggested improvements in work-life balance.',
          rating: 4,
        },
        formalities: defaultFormalities.map((f, index) => ({
          ...f,
          isCompleted: index < 4,
          completedDate: index < 4 ? '2024-04-20' : undefined,
        })),
        assetHandovers: [
          {
            id: 1,
            assetType: 'Laptop',
            assetName: 'Dell Latitude 5520',
            assetId: 'LAP001',
            condition: 'GOOD',
            isReturned: true,
            returnDate: '2024-04-25',
          },
          {
            id: 2,
            assetType: 'Access Card',
            assetName: 'Employee ID Card',
            assetId: 'EMP001',
            condition: 'GOOD',
            isReturned: false,
          },
        ],
        ffSettlement: {
          basicSalary: 75000,
          pendingSalary: 25000,
          leaveEncashment: 15000,
          gratuity: 50000,
          bonus: 10000,
          otherAllowances: 5000,
          deductions: 2000,
          netAmount: 178000,
          components: [
            { component: 'Basic Salary (Pending)', amount: 25000, description: 'April 2024 salary', type: 'CREDIT' },
            { component: 'Leave Encashment', amount: 15000, description: '10 days leave balance', type: 'CREDIT' },
            { component: 'Gratuity', amount: 50000, description: '5 years service gratuity', type: 'CREDIT' },
            { component: 'Performance Bonus', amount: 10000, description: 'Annual bonus pro-rata', type: 'CREDIT' },
            { component: 'Notice Period Recovery', amount: 2000, description: 'Short notice penalty', type: 'DEBIT' },
          ],
        },
        status: 'IN_PROGRESS',
        currentStep: 2,
      };
      setExitProcess(mockProcess);
      setActiveStep(mockProcess.currentStep);
    } catch (error) {
      console.error('Error loading exit process:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormalityChange = (formalityId: number, field: string, value: any) => {
    setExitProcess(prev => ({
      ...prev,
      formalities: prev.formalities.map(f =>
        f.id === formalityId
          ? { ...f, [field]: value, completedDate: field === 'isCompleted' && value ? new Date().toISOString().split('T')[0] : f.completedDate }
          : f
      )
    }));
  };

  const handleAssetHandoverChange = (assetId: number, field: string, value: any) => {
    setExitProcess(prev => ({
      ...prev,
      assetHandovers: prev.assetHandovers.map(a =>
        a.id === assetId
          ? { ...a, [field]: value, returnDate: field === 'isReturned' && value ? new Date().toISOString().split('T')[0] : a.returnDate }
          : a
      )
    }));
  };

  const calculateFFSettlement = () => {
    const { basicSalary, pendingSalary, leaveEncashment, gratuity, bonus, otherAllowances, deductions } = exitProcess.ffSettlement;
    const totalCredits = pendingSalary + leaveEncashment + gratuity + bonus + otherAllowances;
    const netAmount = totalCredits - deductions;
    
    setExitProcess(prev => ({
      ...prev,
      ffSettlement: {
        ...prev.ffSettlement,
        netAmount
      }
    }));
  };

  const getCompletionPercentage = () => {
    const completedFormalities = exitProcess.formalities.filter(f => f.isCompleted).length;
    const totalFormalities = exitProcess.formalities.length;
    return totalFormalities > 0 ? (completedFormalities / totalFormalities) * 100 : 0;
  };

  const getAssetReturnPercentage = () => {
    const returnedAssets = exitProcess.assetHandovers.filter(a => a.isReturned).length;
    const totalAssets = exitProcess.assetHandovers.length;
    return totalAssets > 0 ? (returnedAssets / totalAssets) * 100 : 100;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.saveExitProcess(exitProcess);
      setSnackbar({ open: true, message: 'Exit process updated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error saving exit process:', error);
      setSnackbar({ open: true, message: 'Error saving exit process', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'PENDING_CLEARANCE': return 'warning';
      case 'INITIATED': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Exit Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage employee exit process including formalities, asset handover, and F&F settlement.
      </Typography>
      {/* Progress Stepper */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exit Process Progress
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Chip
            label={`Status: ${exitProcess.status.replace('_', ' ')}`}
            color={getStatusColor(exitProcess.status)}
          />
          <Chip
            label={`Formalities: ${getCompletionPercentage().toFixed(0)}% Complete`}
            color={getCompletionPercentage() === 100 ? 'success' : 'warning'}
          />
          <Chip
            label={`Assets: ${getAssetReturnPercentage().toFixed(0)}% Returned`}
            color={getAssetReturnPercentage() === 100 ? 'success' : 'warning'}
          />
        </Box>
      </Paper>
      {/* Basic Exit Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExitIcon />
          Exit Information
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Resignation Date"
              type="date"
              required
              value={exitProcess.resignationDate}
              onChange={(e) => setExitProcess(prev => ({ ...prev, resignationDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Last Working Date"
              type="date"
              required
              value={exitProcess.lastWorkingDate}
              onChange={(e) => setExitProcess(prev => ({ ...prev, lastWorkingDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <FormControl fullWidth required>
              <InputLabel>Exit Type</InputLabel>
              <Select
                value={exitProcess.exitType}
                label="Exit Type"
                onChange={(e) => setExitProcess(prev => ({ ...prev, exitType: e.target.value as any }))}
              >
                {exitTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Notice Period (Days)"
              type="number"
              value={exitProcess.noticePeriod}
              onChange={(e) => setExitProcess(prev => ({ ...prev, noticePeriod: parseInt(e.target.value) || 0 }))}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Reason for Exit"
              multiline
              rows={3}
              required
              value={exitProcess.reason}
              onChange={(e) => setExitProcess(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Describe the reason for exit..."
            />
          </Grid>
        </Grid>
      </Paper>
      {/* Exit Interview */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormIcon />
            Exit Interview
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setInterviewDialog(true)}
            disabled={exitProcess.exitInterview.conducted}
          >
            {exitProcess.exitInterview.conducted ? 'Interview Completed' : 'Conduct Interview'}
          </Button>
        </Box>

        {exitProcess.exitInterview.conducted ? (
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Typography variant="body2"><strong>Conducted By:</strong> {exitProcess.exitInterview.conductedBy}</Typography>
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Typography variant="body2"><strong>Date:</strong> {exitProcess.exitInterview.date && new Date(exitProcess.exitInterview.date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body2"><strong>Feedback:</strong></Typography>
                  <Typography variant="body2" color="text.secondary">{exitProcess.exitInterview.feedback}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body2"><strong>Overall Rating:</strong></Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(exitProcess.exitInterview.rating || 0) * 20}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">{exitProcess.exitInterview.rating}/5</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info">
            Exit interview not conducted yet. Click the button above to conduct the interview.
          </Alert>
        )}
      </Paper>
      {/* Exit Formalities */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon />
          Exit Formalities
        </Typography>
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={getCompletionPercentage()}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary">
            {exitProcess.formalities.filter(f => f.isCompleted).length} of {exitProcess.formalities.length} formalities completed
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Formality</TableCell>
                <TableCell>Responsible</TableCell>
                <TableCell>Completed Date</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exitProcess.formalities.map((formality) => (
                <TableRow key={formality.id}>
                  <TableCell>
                    <Checkbox
                      checked={formality.isCompleted}
                      onChange={(e) => handleFormalityChange(formality.id, 'isCompleted', e.target.checked)}
                      color="success"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={formality.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{formality.item}</TableCell>
                  <TableCell>{formality.responsible}</TableCell>
                  <TableCell>
                    {formality.completedDate ? new Date(formality.completedDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Add remarks..."
                      value={formality.remarks || ''}
                      onChange={(e) => handleFormalityChange(formality.id, 'remarks', e.target.value)}
                      sx={{ minWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Asset Handover */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HandoverIcon />
          Asset Handover
        </Typography>
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={getAssetReturnPercentage()}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary">
            {exitProcess.assetHandovers.filter(a => a.isReturned).length} of {exitProcess.assetHandovers.length} assets returned
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Asset Type</TableCell>
                <TableCell>Asset Name</TableCell>
                <TableCell>Asset ID</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Return Date</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exitProcess.assetHandovers.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <Checkbox
                      checked={asset.isReturned}
                      onChange={(e) => handleAssetHandoverChange(asset.id, 'isReturned', e.target.checked)}
                      color="success"
                    />
                  </TableCell>
                  <TableCell>{asset.assetType}</TableCell>
                  <TableCell>{asset.assetName}</TableCell>
                  <TableCell>{asset.assetId}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={asset.condition}
                        onChange={(e) => handleAssetHandoverChange(asset.id, 'condition', e.target.value)}
                      >
                        <MenuItem value="GOOD">Good</MenuItem>
                        <MenuItem value="FAIR">Fair</MenuItem>
                        <MenuItem value="DAMAGED">Damaged</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {asset.returnDate ? new Date(asset.returnDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Add remarks..."
                      value={asset.remarks || ''}
                      onChange={(e) => handleAssetHandoverChange(asset.id, 'remarks', e.target.value)}
                      sx={{ minWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {exitProcess.assetHandovers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No assets assigned to this employee.
            </Typography>
          </Box>
        )}
      </Paper>
      {/* F&F Settlement */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FinanceIcon />
          Full & Final Settlement
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 8
            }}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount (₹)</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exitProcess.ffSettlement.components.map((component, index) => (
                    <TableRow key={index}>
                      <TableCell>{component.component}</TableCell>
                      <TableCell>{component.description}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={component.type === 'CREDIT' ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {component.type === 'CREDIT' ? '+' : '-'}₹{component.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={component.type}
                          color={component.type === 'CREDIT' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2}><strong>Net Settlement Amount</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        ₹{exitProcess.ffSettlement.netAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <Card sx={{ backgroundColor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Settlement Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Credits:</Typography>
                  <Typography variant="body2" color="success.main">
                    ₹{(exitProcess.ffSettlement.pendingSalary + exitProcess.ffSettlement.leaveEncashment + 
                       exitProcess.ffSettlement.gratuity + exitProcess.ffSettlement.bonus + 
                       exitProcess.ffSettlement.otherAllowances).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Deductions:</Typography>
                  <Typography variant="body2" color="error.main">
                    ₹{exitProcess.ffSettlement.deductions.toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Net Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{exitProcess.ffSettlement.netAmount.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/employees')}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Exit Process'}
        </Button>
      </Box>
      {/* Exit Interview Dialog */}
      <Dialog open={interviewDialog} onClose={() => setInterviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Conduct Exit Interview</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Conducted By"
                value={exitProcess.exitInterview.conductedBy || ''}
                onChange={(e) => setExitProcess(prev => ({
                  ...prev,
                  exitInterview: { ...prev.exitInterview, conductedBy: e.target.value }
                }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Interview Date"
                type="date"
                value={exitProcess.exitInterview.date || ''}
                onChange={(e) => setExitProcess(prev => ({
                  ...prev,
                  exitInterview: { ...prev.exitInterview, date: e.target.value }
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Interview Feedback"
                multiline
                rows={4}
                value={exitProcess.exitInterview.feedback || ''}
                onChange={(e) => setExitProcess(prev => ({
                  ...prev,
                  exitInterview: { ...prev.exitInterview, feedback: e.target.value }
                }))}
                placeholder="Record the key points from the exit interview..."
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" gutterBottom>Overall Experience Rating (1-5):</Typography>
              <TextField
                type="number"
                value={exitProcess.exitInterview.rating || 0}
                onChange={(e) => setExitProcess(prev => ({
                  ...prev,
                  exitInterview: { ...prev.exitInterview, rating: parseInt(e.target.value) || 0 }
                }))}
                InputProps={{ inputProps: { min: 1, max: 5 } }}
                sx={{ width: 100 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setExitProcess(prev => ({
                ...prev,
                exitInterview: { ...prev.exitInterview, conducted: true }
              }));
              setInterviewDialog(false);
            }}
          >
            Save Interview
          </Button>
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExitManagementForm;
