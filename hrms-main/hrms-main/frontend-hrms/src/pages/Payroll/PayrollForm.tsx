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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../../services/api';
import axios from 'axios';

interface PayrollRecord {
  id?: number;
  employeeId: number;
  employeeName?: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: {
    hra: number;
    transport: number;     // represents Performance Bonus Earned
    medical: number;       // represents Leave Encashment Earned
    other: number;         // represents Other Allowances Earned
    advanceBonus: number;  // represents Advance Bonus Earned
  };
  deductions: {
    pf: number;
    esi: number;
    tax: number;           // represents Professional Tax
    other: number;         // represents Labor Welfare Fund (Self)
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

  // Base excel components (White cells)
  baseBasic: number;
  baseHra: number;
  baseOther: number;
  baseBonus: number;
  baseLeave: number;
  baseAdvance: number;
  pTax: number;
  lwfSelf: number;
  lwfCompany: number;
  usePfCap: boolean;

  // Employer contributions (Section III)
  emrPf: number;
  emrEsic: number;
  emrGratuity: number;
  emrLwf: number;
  companyAdditionalCost: number;
  totalCtc: number;
}

const PayrollForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const calculatedFieldSx = {
    '& .MuiFilledInput-root': {
      backgroundColor: '#fffde7',
      '&:hover': {
        backgroundColor: '#fff9c4',
      },
      '&.Mui-focused': {
        backgroundColor: '#fff9c4',
      }
    }
  };

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
      advanceBonus: 0,
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
    workingDays: 27,
    presentDays: 27,
    status: 'DRAFT',
    calculationBasis: 'Old Basis',
    esicCovered: 'No',
    baseGrossSalary: 29057,

    // Base salary break-up calculator inputs (White cells)
    baseBasic: 0,
    baseHra: 0,
    baseOther: 0,
    baseBonus: 0,
    baseLeave: 0,
    baseAdvance: 0,
    pTax: 0,
    lwfSelf: 0,
    lwfCompany: 0,
    usePfCap: false,

    // Employer calculations (Section III)
    emrPf: 0,
    emrEsic: 0,
    emrGratuity: 0,
    emrLwf: 0,
    companyAdditionalCost: 0,
    totalCtc: 0,
  });

  useEffect(() => {
    loadEmployees();
    if (isEdit && id) {
      loadPayrollRecord(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (payroll.employeeId && payroll.month) {
      const [yearStr, monthStr] = payroll.month.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      
      const fetchAttendance = async () => {
        try {
          const response = await apiService.getEmployeeAttendanceStats(payroll.employeeId, year, month);
          if (response.success && response.data) {
             setPayroll(prev => ({
               ...prev,
               workingDays: response.data.workingDays || 0,
               presentDays: response.data.presentDays || 0,
             }));
          }
        } catch(error) {
          console.warn('Error fetching attendance stats', error);
        }
      };
      fetchAttendance();
    }
  }, [payroll.employeeId, payroll.month]);

  useEffect(() => {
    calculateSalary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    payroll.workingDays,
    payroll.presentDays,
    payroll.esicCovered,
    payroll.usePfCap,
    payroll.baseBasic,
    payroll.baseHra,
    payroll.baseOther,
    payroll.baseBonus,
    payroll.baseLeave,
    payroll.baseAdvance,
    payroll.pTax,
    payroll.lwfSelf,
    payroll.lwfCompany
  ]);

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
    const ratio = payroll.workingDays > 0 ? (payroll.presentDays / payroll.workingDays) : 0;

    const baseBasic = Number(payroll.baseBasic) || 0;
    const baseHra = Number(payroll.baseHra) || 0;
    const baseOther = Number(payroll.baseOther) || 0;
    const baseBonus = Number(payroll.baseBonus) || 0;
    const baseLeave = Number(payroll.baseLeave) || 0;
    const baseAdvance = Number(payroll.baseAdvance) || 0;
    const pTax = Number(payroll.pTax) || 0;
    const lwfSelf = Number(payroll.lwfSelf) || 0;
    const lwfCompany = Number(payroll.lwfCompany) || 0;

    // Pro-rate based on attendance (Requirement 4)
    const proBasic = Math.round(baseBasic * ratio);
    const proHra = Math.round(baseHra * ratio);
    const proOther = Math.round(baseOther * ratio);
    const proBonus = Math.round(baseBonus * ratio);
    const proLeave = Math.round(baseLeave * ratio);
    const proAdvance = Math.round(baseAdvance * ratio);
    const proGross = proBasic + proHra + proOther + proBonus + proLeave + proAdvance;

    // Employee Deductions (Section II)
    // PF Capped logic: If Basic Earned > 15000: PF = 1800. Else 12% (Requirement 5)
    let emyPF = 0;
    if (payroll.usePfCap) {
      emyPF = proBasic > 15000 ? 1800 : Math.round(proBasic * 0.12);
    } else {
      emyPF = Math.round(proBasic * 0.12);
    }

    // ESI Capped logic: If ESIC enabled AND Gross Salary < 21001 (Requirement 6)
    const emyESIC = (payroll.esicCovered === 'Yes' && proGross < 21001) ? Math.round(proGross * 0.0075) : 0;

    const totalDeductions = emyPF + emyESIC + pTax + lwfSelf;
    const netSalary = Math.round(proGross - totalDeductions);

    // Employer Contributions (Section III / Requirement 10)
    let emrPF = 0;
    if (payroll.usePfCap) {
      emrPF = proBasic > 15000 ? 1950 : Math.round(proBasic * 0.13); // includes Employer PF (12%) and PF Admin (1%)
    } else {
      emrPF = Math.round(proBasic * 0.13);
    }

    const emrESIC = (payroll.esicCovered === 'Yes' && proGross < 21001) ? Math.round(proGross * 0.0325) : 0;
    const gratuity = Math.round(proBasic * 15 / 26 / 12); // Requirement 7

    const companyAdditionalCost = emrPF + emrESIC + gratuity + lwfCompany;
    const totalCtc = proGross + companyAdditionalCost;

    setPayroll(prev => ({
      ...prev,
      basicSalary: proBasic,
      allowances: {
        hra: proHra,
        transport: proBonus,
        medical: proLeave,
        other: proOther,
        advanceBonus: proAdvance,
      },
      deductions: {
        pf: emyPF,
        esi: emyESIC,
        tax: pTax,
        other: lwfSelf,
      },
      grossSalary: proGross,
      totalDeductions: totalDeductions,
      netSalary: netSalary,
      emrPf: emrPF,
      emrEsic: emrESIC,
      emrGratuity: gratuity,
      emrLwf: lwfCompany,
      companyAdditionalCost,
      totalCtc,
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

    try {
      // Query the employee's appointment letters
      const response = await axios.get(`${API_BASE_URL}/api/appointment-letters/my-letters/${employeeId}`);
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Take the latest appointment letter
        const latestLetter = response.data.data[0];
        
        // Fetch full letter details to get appointment_data
        const detailsResponse = await axios.get(`${API_BASE_URL}/api/appointment-letters/${latestLetter.id}`);
        if (detailsResponse.data.success && detailsResponse.data.data) {
          const letterDetails = detailsResponse.data.data;
          // Parse appointment_data
          const offerData = typeof letterDetails.appointment_data === 'string' 
            ? JSON.parse(letterDetails.appointment_data) 
            : letterDetails.appointment_data;
          
          if (offerData) {
            console.log('Setting payroll data with offerData:', offerData);
            setPayroll(prev => ({
              ...prev,
              baseGrossSalary: Number(offerData.grossSalary) || 0,
              baseBasic: Number(offerData.basicSalary) || 0,
              baseHra: Number(offerData.hra) || 0,
              baseOther: Number(offerData.otherAllowances) || 0,
              baseBonus: Number(offerData.performanceBonus) || 0,
              baseLeave: Number(offerData.leaveEncashment) || 0,
              baseAdvance: Number(offerData.advanceBonus) || 0,
              pTax: Number(offerData.pTax) || 0,
              lwfSelf: Number(offerData.lwfEmployee) || 0,
              lwfCompany: Number(offerData.lwfEmployer) || 0,
              usePfCap: offerData.usePfCap || false,
              esicCovered: offerData.esicCovered || 'No',
              calculationBasis: offerData.calculationBasis || 'Old Basis'
            }));
            
            setSnackbar({
              open: true,
              message: `Loaded salary structure from employee's latest Appointment Letter!`,
              severity: 'success'
            });
            return;
          }
        }
      }
    } catch (error) {
      console.warn('Error loading employee salary structure from Appointment Letter:', error);
    }

    // Fallback default values
    setPayroll(prev => ({
      ...prev,
      baseGrossSalary: 0,
      baseBasic: 0,
      baseHra: 0,
      baseOther: 0,
      baseBonus: 0,
      baseLeave: 0,
      baseAdvance: 0,
      pTax: 0,
      lwfSelf: 0,
      lwfCompany: 0,
      usePfCap: false,
      esicCovered: 'No',
      calculationBasis: 'Old Basis'
    }));
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
        payroll_data: payroll,
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

            {/* Salary Information Inputs */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'primary.main', fontWeight: 'bold' }}>
                Base Salary Breakup Structure (Excel Monthly Calculator)
              </Typography>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Enter the monthly base components below (white cells). They will be automatically pro-rated based on the employee's attendance. Selecting an employee will attempt to auto-load these values from their latest Offer Letter.
              </Alert>
            </Grid>

            {/* Base Basic */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Base Basic Salary"
                type="number"
                required
                value={payroll.baseBasic || ''}
                onChange={(e) => handleInputChange('baseBasic', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* Base HRA */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Base HRA"
                type="number"
                required
                value={payroll.baseHra || ''}
                onChange={(e) => handleInputChange('baseHra', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* Base Other Allowances */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Base Other Allowances"
                type="number"
                value={payroll.baseOther || ''}
                onChange={(e) => handleInputChange('baseOther', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* Base Performance Bonus */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Base Performance Bonus"
                type="number"
                value={payroll.baseBonus || ''}
                onChange={(e) => handleInputChange('baseBonus', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* Base Leave Encashment */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Base Leave Encashment"
                type="number"
                value={payroll.baseLeave || ''}
                onChange={(e) => handleInputChange('baseLeave', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* Base Advance Bonus */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Base Advance Bonus"
                type="number"
                value={payroll.baseAdvance || ''}
                onChange={(e) => handleInputChange('baseAdvance', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* Professional Tax */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Professional Tax"
                type="number"
                value={payroll.pTax || ''}
                onChange={(e) => handleInputChange('pTax', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* LWF Self */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="LWF (Self Contribution)"
                type="number"
                value={payroll.lwfSelf || ''}
                onChange={(e) => handleInputChange('lwfSelf', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* LWF Company */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="LWF (Company Contribution)"
                type="number"
                value={payroll.lwfCompany || ''}
                onChange={(e) => handleInputChange('lwfCompany', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* ESIC Toggle and PF limit switches */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
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
              <FormControlLabel
                control={
                  <Switch
                    checked={payroll.usePfCap}
                    onChange={(e) => handleInputChange('usePfCap', e.target.checked)}
                    color="secondary"
                    size="small"
                  />
                }
                label={<Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Limit PF to 15,000 Basic (Cap)</Typography>}
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                Calculated Attendance-Based Earned Breakup (ratio = {payroll.presentDays} / {payroll.workingDays})
              </Typography>
            </Grid>

            {/* Earnings output */}
            <Grid size={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Earned Earnings (Pro-rated)
              </Typography>
            </Grid>

            {/* Earned Basic */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Earned Basic"
                value={payroll.basicSalary || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Earned HRA */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Earned HRA"
                value={payroll.allowances.hra || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Earned Other Allowances */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Earned Other Allowances"
                value={payroll.allowances.other || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Earned Performance Bonus */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Earned Performance Bonus"
                value={payroll.allowances.transport || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Earned Leave Encashment */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Earned Leave Encashment"
                value={payroll.allowances.medical || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Earned Advance Bonus */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Earned Advance Bonus"
                value={payroll.allowances.advanceBonus || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Deductions output */}
            <Grid size={12}>
              <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 'bold', color: 'error.main' }}>
                Deductions (Self Contribution)
              </Typography>
            </Grid>

            {/* PF Self */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="P.F. Deduction (Self)"
                value={payroll.deductions.pf || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* ESI Self */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="ESI Deduction (Self)"
                value={payroll.deductions.esi || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* PTax */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Professional Tax"
                value={payroll.deductions.tax || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* LWF Self */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Labor Welfare Fund (Self)"
                value={payroll.deductions.other || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Employer Contributions output */}
            <Grid size={12}>
              <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>
                Employer Contributions (Section III)
              </Typography>
            </Grid>

            {/* Employer PF */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Employer P.F. (13%)"
                value={payroll.emrPf || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Employer ESI */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Employer ESI (3.25%)"
                value={payroll.emrEsic || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Gratuity */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Gratuity"
                value={payroll.emrGratuity || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Employer LWF */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Employer LWF"
                value={payroll.emrLwf || 0}
                variant="filled"
                sx={calculatedFieldSx}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            {/* Summary */}
            <Grid size={12}>
              <Card sx={{ mt: 2, background: 'linear-gradient(135deg, rgba(30, 60, 114, 0.05) 0%, rgba(42, 82, 152, 0.05) 100%)', border: '1px solid rgba(30, 60, 114, 0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                    Payroll Sheet Summary
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Gross Earned Salary (A)</Typography>
                      <Typography variant="h6" fontWeight="bold">₹ {payroll.grossSalary.toLocaleString('en-IN')}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Gross Deductions (B)</Typography>
                      <Typography variant="h6" fontWeight="bold" color="error">₹ {payroll.totalDeductions.toLocaleString('en-IN')}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Employee Take Home (C = A - B)</Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">₹ {payroll.netSalary.toLocaleString('en-IN')}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Total CTC of Company</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">₹ {payroll.totalCtc.toLocaleString('en-IN')}</Typography>
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
                  sx={{
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    boxShadow: '0 4px 12px rgba(30, 60, 114, 0.2)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #122548 0%, #1e3c72 100%)',
                    }
                  }}
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
          sx={{ whiteSpace: 'pre-line', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PayrollForm;
