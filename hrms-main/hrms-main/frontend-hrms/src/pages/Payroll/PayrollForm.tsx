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
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

interface PayrollRecord {
  id?: number;
  employeeId: number;
  employeeName?: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: {
    hra: number;
    transport: number;
    medical: number;
    other: number;
  };
  deductions: {
    pf: number;
    esi: number;
    tax: number;
    other: number;
  };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
  calculationBasis: 'New Government Rule' | 'Old Basis';
  esicCovered: 'Yes' | 'No';
  baseGrossSalary: number;
}

const PayrollForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [payroll, setPayroll] = useState<PayrollRecord>({
    employeeId: 0,
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: {
      hra: 0,
      transport: 0,
      medical: 0,
      other: 0,
    },
    deductions: {
      pf: 0,
      esi: 0,
      tax: 0,
      other: 0,
    },
    grossSalary: 0,
    totalDeductions: 0,
    netSalary: 0,
    workingDays: 22,
    presentDays: 22,
    status: 'DRAFT',
    calculationBasis: 'Old Basis',
    esicCovered: 'No',
    baseGrossSalary: 0,
  });

  useEffect(() => {
    loadEmployees();
    if (isEdit && id) {
      loadPayrollRecord(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    calculateSalary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payroll.baseGrossSalary, payroll.calculationBasis, payroll.esicCovered, payroll.workingDays, payroll.presentDays]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees(0, 100);
      setEmployees(response.data?.content || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([
        { id: 1, firstName: 'John', lastName: 'Doe', employeeId: 'EMP001' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', employeeId: 'EMP002' },
      ]);
    }
  };

  const loadPayrollRecord = async (payrollId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getPayslipById(payrollId);
      if (response.success && response.data) {
        const data = response.data as any;
        const monthStr = data.month < 10 ? `0${data.month}` : `${data.month}`;
        setPayroll(prev => ({
          ...prev,
          employeeId: data.employee_id,
          month: `${data.year}-${monthStr}`,
          year: data.year,
          baseGrossSalary: data.gross_salary, // Assume base = gross for simple edit
          grossSalary: data.gross_salary,
          netSalary: data.net_salary,
          basicSalary: data.gross_salary,
          allowances: { hra: 0, transport: 0, medical: 0, other: 0 },
          deductions: { pf: 0, esi: 0, tax: 0, other: data.gross_salary - data.net_salary },
        }));
      }
    } catch (error) {
      console.error('Error loading payroll record:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = () => {
    const gross = payroll.baseGrossSalary || 0;

    let basic = 0;
    let hra = 0;
    let other = 0;
    let bonus = 0;

    if (payroll.calculationBasis === 'Old Basis') {
      basic = Math.round(gross / 2.0833);
      hra = Math.round(basic * 0.5);
      bonus = Math.round(basic * 0.0833 * 10) / 10;
      other = Math.max(0, gross - (basic + hra + bonus));
    } else {
      basic = Math.round(gross * 0.57242);
      hra = Math.round(basic * 0.5);
      bonus = Math.round(basic * 0.0833 * 10) / 10;
      other = Math.max(0, gross - (basic + hra + bonus));
    }

    const ratio = payroll.workingDays > 0 ? (payroll.presentDays / payroll.workingDays) : 0;

    // Pro-rate based on attendance
    const proBasic = Math.round(basic * ratio);
    const proHra = Math.round(hra * ratio);
    const proBonus = Math.round(bonus * ratio);
    const proOther = Math.round(other * ratio);
    const proGross = proBasic + proHra + proBonus + proOther;

    // Deductions
    const emyPF = Math.round(proBasic * 0.12);
    const emyESIC = payroll.esicCovered === 'Yes' && gross <= 21000 ? Math.ceil(proGross * 0.0075) : 0;
    const pTax = gross > 15000 ? 200 : 0;
    const lwfEmployee = payroll.esicCovered === 'Yes' ? 10 : 0;

    const totalDeductions = emyPF + emyESIC + pTax + lwfEmployee;
    const netSalary = Math.round(proGross - totalDeductions);

    setPayroll(prev => ({
      ...prev,
      basicSalary: proBasic,
      allowances: {
        hra: proHra,
        transport: proBonus,
        medical: 0,
        other: proOther,
      },
      deductions: {
        pf: emyPF,
        esi: emyESIC,
        tax: pTax,
        other: lwfEmployee,
      },
      grossSalary: proGross,
      totalDeductions: totalDeductions,
      netSalary: netSalary,
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPayroll(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseFloat(value) || 0,
        },
      }));
    } else {
      setPayroll(prev => ({
        ...prev,
        [field]: field === 'employeeId' || field === 'workingDays' || field === 'presentDays'
          ? parseInt(value) || 0
          : field === 'basicSalary'
            ? parseFloat(value) || 0
            : value,
      }));
    }
  };

  const handleEmployeeChange = async (employeeId: number) => {
    setPayroll(prev => ({ ...prev, employeeId }));

    // Auto-load employee salary details if available
    try {
      // In real app: const salaryDetails = await apiService.getEmployeeSalary(employeeId);
      // For now, set default values
      setPayroll(prev => ({
        ...prev,
        baseGrossSalary: 50000,
        calculationBasis: 'Old Basis',
        esicCovered: 'No'
      }));
    } catch (error) {
      console.error('Error loading employee salary:', error);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!payroll.employeeId) errors.push('Employee is required');
    if (!payroll.month) errors.push('Month is required');
    if (payroll.baseGrossSalary <= 0) errors.push('Base Gross Salary must be greater than 0');
    if (payroll.workingDays <= 0) errors.push('Working Days must be greater than 0');
    if (payroll.presentDays < 0) errors.push('Present Days cannot be negative');
    if (payroll.presentDays > payroll.workingDays) errors.push('Present Days cannot exceed Working Days');

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
      const [yearStr, monthStr] = payroll.month.split('-');
      const payslipPayload = {
        employee_id: payroll.employeeId,
        month: parseInt(monthStr, 10),
        year: parseInt(yearStr, 10),
        gross_salary: payroll.grossSalary,
        net_salary: payroll.netSalary,
      };

      if (isEdit && id) {
        await apiService.updatePayslip(parseInt(id), payslipPayload as any);
        setSnackbar({ open: true, message: 'Payslip updated successfully!', severity: 'success' });
      } else {
        await apiService.createPayslip(payslipPayload as any);
        setSnackbar({ open: true, message: 'Payslip created successfully!', severity: 'success' });
      }
      setTimeout(() => navigate('/payslips'), 1500);
    } catch (error) {
      console.error('Error saving payroll:', error);
      setSnackbar({ open: true, message: 'Error saving payroll. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/payslips');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit Payroll' : 'Generate Payroll'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create or edit payroll records for employees.
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth required>
                <InputLabel id="payroll-employee-label" shrink={!!payroll.employeeId || true}>Employee</InputLabel>
                <Select
                  labelId="payroll-employee-label"
                  value={payroll.employeeId || ''}
                  label="Employee"
                  onChange={(e) => handleEmployeeChange(parseInt(e.target.value))}
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

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Month"
                type="month"
                required
                value={payroll.month}
                onChange={(e) => handleInputChange('month', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth>
                <InputLabel id="payroll-status-label" shrink={!!payroll.status || true}>Status</InputLabel>
                <Select
                  labelId="payroll-status-label"
                  value={payroll.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  displayEmpty
                  renderValue={(selected: any) => {
                    if (!selected || selected === '') {
                      return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>Select Status</span>;
                    }
                    const statusLabels: { [key: string]: string } = {
                      'DRAFT': 'Draft',
                      'PROCESSED': 'Processed',
                      'PAID': 'Paid',
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
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PROCESSED">Processed</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Attendance Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Attendance Information
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Working Days"
                type="number"
                required
                value={payroll.workingDays}
                onChange={(e) => handleInputChange('workingDays', e.target.value)}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Present Days"
                type="number"
                required
                value={payroll.presentDays}
                onChange={(e) => handleInputChange('presentDays', e.target.value)}
              />
            </Grid>

            {/* Salary Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Salary Information
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Salary components are auto-calculated based on Calculation Basis and Base Monthly Gross Salary.
              </Alert>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth>
                <InputLabel id="payroll-calc-basis-label" shrink>Calculation Basis</InputLabel>
                <Select
                  labelId="payroll-calc-basis-label"
                  value={payroll.calculationBasis}
                  label="Calculation Basis"
                  onChange={(e) => handleInputChange('calculationBasis', e.target.value)}
                >
                  <MenuItem value="Old Basis">Old Basis</MenuItem>
                  <MenuItem value="New Government Rule">New Government Rule</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth>
                <InputLabel id="payroll-esic-label" shrink>ESIC Covered</InputLabel>
                <Select
                  labelId="payroll-esic-label"
                  value={payroll.esicCovered}
                  label="ESIC Covered"
                  onChange={(e) => handleInputChange('esicCovered', e.target.value)}
                >
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Base Monthly Gross Salary"
                type="number"
                required
                value={payroll.baseGrossSalary}
                onChange={(e) => handleInputChange('baseGrossSalary', e.target.value)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Calculated Pro-Rated Components Based on Attendance
              </Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Earnings
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Basic Salary (Pro-rated)"
                type="number"
                value={payroll.basicSalary}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            {/* Allowances */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Allowances
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="HRA"
                type="number"
                value={payroll.allowances.hra}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Performance Bonus / Transport"
                type="number"
                value={payroll.allowances.transport}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Medical Allowance"
                type="number"
                value={payroll.allowances.medical}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Other Allowances"
                type="number"
                value={payroll.allowances.other}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            {/* Deductions */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Deductions
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Provident Fund"
                type="number"
                value={payroll.deductions.pf}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="ESI"
                type="number"
                value={payroll.deductions.esi}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Professional Tax"
                type="number"
                value={payroll.deductions.tax}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Other Deductions (LWF)"
                type="number"
                value={payroll.deductions.other}
                InputProps={{ startAdornment: '₹', readOnly: true }}
              />
            </Grid>

            {/* Summary */}
            <Grid size={12}>
              <Card sx={{ mt: 2, backgroundColor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Salary Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        md: 4
                      }}>
                      <Typography variant="body1">
                        <strong>Gross Salary: ₹{payroll.grossSalary.toLocaleString()}</strong>
                      </Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        md: 4
                      }}>
                      <Typography variant="body1">
                        <strong>Total Deductions: ₹{payroll.totalDeductions.toLocaleString()}</strong>
                      </Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        md: 4
                      }}>
                      <Typography variant="h6" color="primary">
                        <strong>Net Salary: ₹{payroll.netSalary.toLocaleString()}</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

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
                  {loading ? 'Saving...' : isEdit ? 'Update Payroll' : 'Generate Payroll'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
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

export default PayrollForm;
