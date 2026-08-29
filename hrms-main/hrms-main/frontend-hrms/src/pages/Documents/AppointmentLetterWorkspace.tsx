// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid as MuiGrid,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  GridProps,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import {
  Print as PrintIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  NavigateBefore as BackIcon,
  PersonOutline as PersonIcon,
  SettingsOutlined as SettingsIcon,
  MonetizationOnOutlined as SalaryIcon,
  FingerprintOutlined as FingerprintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api, getPublicUrl } from '../../services/api';

// Custom Grid wrapper component to ensure div rendering for standard DKG grid items
const Grid = (props: GridProps & {
  item?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
}) => {
  if (props.item) {
    return <MuiGrid component="div" {...props} />;
  }
  return <MuiGrid {...props} />;
};

// --- Indian Number-to-Words Helper ---
const numberToIndianWords = (num: number): string => {
  if (isNaN(num) || num <= 0) return '';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const helper = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
    return '';
  };

  let result = '';
  let temp = Math.round(num);

  if (Math.floor(temp / 10000000) > 0) {
    result += helper(Math.floor(temp / 10000000)) + ' Crore ';
    temp %= 10000000;
  }

  if (Math.floor(temp / 100000) > 0) {
    result += helper(Math.floor(temp / 100000)) + ' Lakh ';
    temp %= 100000;
  }

  if (Math.floor(temp / 1000) > 0) {
    result += helper(Math.floor(temp / 1000)) + ' Thousand ';
    temp %= 1000;
  }

  if (temp > 0) {
    if (result !== '' && temp < 100) {
      result += 'and ' + helper(temp);
    } else {
      result += helper(temp);
    }
  }

  return result.trim() ? result.trim() + ' Only' : '';
};

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str.replace(/\b\w/g, l => l.toUpperCase());
};

const formatCellVal = (val: any) => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString('en-IN');
};

const AppointmentLetterWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showAnnexure, setShowAnnexure] = useState(true);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  // Excel-based Salary break-up states
  const [salaryInputs, setSalaryInputs] = useState({
    basic: 0,
    hra: 0,
    otherAllowances: 0,
    leaveEncashment: 0,
    advanceBonus: 0,
    pTax: 0,
    lwfSelf: 0,
    lwfCompany: 0,
    usePfCap: false,
    uniformCharges: 0,
  });

  // Main Form Data State
  const [formData, setFormData] = useState({
    referenceNumber: `CLPL/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    candidateName: '',
    address: '',
    designation: '',
    location: 'Gurgaon',
    baseLocation: 'Gurgaon',
    joiningDate: '',
    dob: '',
    calculationBasis: 'Old Basis' as 'Old Basis' | 'New Government Rule',
    esicCovered: 'No' as 'Yes' | 'No',
    basicSalary: 0,
    hra: 0,
    otherAllowances: 0,
    performanceBonus: 0,
    leaveEncashment: 0,
    advanceBonus: 0,
    grossSalary: 29057,
    emyPF: 2024,
    emyESIC: 0,
    pTax: 0,
    lwfEmployee: 0,
    uniformCharges: 0,
    totalDeductions: 2224,
    netAmount: 26833,
    emrPF: 2024,
    emrAdminCharges: 169,
    emrESIC: 0,
    lwfEmployer: 0,
    gratuity: 811,
    totalEMRContribution: 3004,
    monthlySalary: 29057,
    monthlyCTC: 32061,
    yearlyCTC: 384730,
    ctcWord: 'Three Lakh Eighty Four Thousand Seven Hundred and Thirty Only',
    probation: 'You shall be on probation for a period of 6 months from the date of your joining.',
    acceptanceCandidateName: '',
    aadhaarNumber: '',
    acceptanceDate: new Date().toISOString().split('T')[0],
    candidateSignature: null as string | null,
    employeeId: null as number | null
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      if (response.data.success) {
        setEmployees(response.data.data.content || []);
      }
    } catch (e) {
      console.error('Error fetching employees:', e);
    }
  };

  // Salary Calculator Formula (Manual Breakup Calculator Only)
  useEffect(() => {
    const basicMonth = Number(salaryInputs.basic) || 0;
    const hraMonth = Number(salaryInputs.hra) || 0;
    const otherMonth = Number(salaryInputs.otherAllowances) || 0;
    const leaveMonth = Number(salaryInputs.leaveEncashment) || 0;
    const advanceMonth = Number(salaryInputs.advanceBonus) || 0;
    const pTaxMonth = Number(salaryInputs.pTax) || 0;
    const uniformChargesMonth = Number(salaryInputs.uniformCharges) || 0;
    const uniformChargesYear = uniformChargesMonth * 12;
    const lwfSelfMonth = Number(salaryInputs.lwfSelf) || 0;
    const lwfCompanyMonth = Number(salaryInputs.lwfCompany) || 0;

    const basicYear = basicMonth * 12;
    const hraYear = hraMonth * 12;
    const otherYear = otherMonth * 12;
    const leaveYear = leaveMonth * 12;
    const advanceYear = advanceMonth * 12;

    const grossMonth = basicMonth + hraMonth + otherMonth + leaveMonth + advanceMonth;
    const grossYear = basicYear + hraYear + otherYear + leaveYear + advanceYear;

    let pfSelfMonth = 0;
    if (salaryInputs.usePfCap) {
      pfSelfMonth = basicMonth > 15000 ? 1800 : Math.round(basicMonth * 0.12);
    } else {
      pfSelfMonth = Math.round(basicMonth * 0.12);
    }

    const esicSelfMonth = grossMonth < 21001 ? Math.round(grossMonth * 0.0075) : 0;

    const grossDeductionMonth = pfSelfMonth + esicSelfMonth + pTaxMonth + lwfSelfMonth;

    const takeHomeMonth = grossMonth - grossDeductionMonth;

    let pfCompanyMonth = 0;
    let pfCompanyYear = 0;
    if (salaryInputs.usePfCap) {
      pfCompanyMonth = basicMonth > 15000 ? 1950 : Math.round(basicMonth * 0.13);
      pfCompanyYear = basicYear > 180000 ? 23400 : Math.round(basicYear * 0.13);
    } else {
      pfCompanyMonth = Math.round(basicMonth * 0.13);
      pfCompanyYear = Math.round(basicYear * 0.13);
    }

    let emrPF = 0;
    let emrAdmin = 0;
    if (salaryInputs.usePfCap) {
      emrPF = basicMonth > 15000 ? 1800 : Math.round(basicMonth * 0.12);
      emrAdmin = basicMonth > 15000 ? 150 : Math.round(basicMonth * 0.01);
    } else {
      emrPF = Math.round(basicMonth * 0.12);
      emrAdmin = Math.round(basicMonth * 0.01);
    }

    const esicCompanyMonth = grossMonth < 21001 ? Math.round(grossMonth * 0.0325) : 0;
    const esicCompanyYear = grossYear < 252012 ? Math.round(grossYear * 0.0325) : 0;

    const gratuityMonth = Math.round(basicMonth * 15 / 26 / 12);
    const gratuityYear = Math.round(basicYear * 15 / 26 / 12);

    const lwfCompanyYear = lwfCompanyMonth * 12;

    const companyAdditionalCostMonth = pfCompanyMonth + esicCompanyMonth + gratuityMonth + lwfCompanyMonth + uniformChargesMonth;
    const companyAdditionalCostYear = pfCompanyYear + esicCompanyYear + gratuityYear + lwfCompanyYear + uniformChargesYear;

    const totalCtcMonth = grossMonth + companyAdditionalCostMonth;
    const totalCtcYear = grossYear + companyAdditionalCostYear;
    const ctcWord = numberToIndianWords(totalCtcYear);

    setFormData(prev => ({
      ...prev,
      basicSalary: basicMonth,
      hra: hraMonth,
      otherAllowances: otherMonth,
      performanceBonus: 0,
      leaveEncashment: leaveMonth,
      advanceBonus: advanceMonth,
      grossSalary: grossMonth,
      emyPF: pfSelfMonth,
      emyESIC: esicSelfMonth,
      pTax: pTaxMonth,
      lwfEmployee: lwfSelfMonth,
      uniformCharges: uniformChargesMonth,
      totalDeductions: grossDeductionMonth,
      netAmount: takeHomeMonth,
      emrPF,
      emrAdminCharges: emrAdmin,
      emrESIC: esicCompanyMonth,
      lwfEmployer: lwfCompanyMonth,
      gratuity: gratuityMonth,
      totalEMRContribution: companyAdditionalCostMonth,
      monthlySalary: grossMonth,
      monthlyCTC: totalCtcMonth,
      yearlyCTC: totalCtcYear,
      ctcWord,
      usePfCap: salaryInputs.usePfCap,
      calculationBasis: 'Old Basis',
      esicCovered: grossMonth < 21001 ? 'Yes' : 'No',
      acceptanceCandidateName: prev.acceptanceCandidateName || prev.candidateName
    }));
  }, [
    salaryInputs,
    formData.candidateName
  ]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmployeeSelect = (empId: number) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeId: emp.id,
        candidateName: `${emp.firstName} ${emp.lastName}`,
        address: emp.address || '',
        designation: emp.designationName || '',
        baseLocation: emp.workLocationName || 'Gurgaon',
        dob: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
        joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : ''
      }));
    }
  };

  const handleClear = () => {
    setFormData({
      referenceNumber: `CLPL/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      candidateName: '',
      address: '',
      designation: '',
      location: 'Gurgaon',
      baseLocation: 'Gurgaon',
      joiningDate: '',
      dob: '',
      calculationBasis: 'Old Basis',
      esicCovered: 'No',
      basicSalary: 16868,
      hra: 8434,
      otherAllowances: 3755,
      performanceBonus: 0,
      leaveEncashment: 0,
      advanceBonus: 0,
      grossSalary: 29057,
      emyPF: 2024,
      emyESIC: 0,
      pTax: 200,
      lwfEmployee: 0,
      totalDeductions: 2224,
      netAmount: 26833,
      emrPF: 2024,
      emrAdminCharges: 169,
      emrESIC: 0,
      lwfEmployer: 0,
      gratuity: 811,
      totalEMRContribution: 3004,
      monthlySalary: 29057,
      monthlyCTC: 32061,
      yearlyCTC: 384730,
      ctcWord: 'Three Lakh Eighty Four Thousand Seven Hundred and Thirty Only',
      probation: 'You shall be on probation for a period of 6 months from the date of your joining.',
      acceptanceCandidateName: '',
      aadhaarNumber: '',
      acceptanceDate: new Date().toISOString().split('T')[0],
      candidateSignature: null,
      employeeId: null
    });
    setSalaryInputs({
      basic: 0,
      hra: 0,
      otherAllowances: 0,
      leaveEncashment: 0,
      advanceBonus: 0,
      pTax: 0,
      lwfSelf: 0,
      lwfCompany: 0,
      usePfCap: false,
    });
  };

  const handleSave = async () => {
    if (!formData.candidateName || !formData.designation || !formData.joiningDate) {
      setSnackbar({
        open: true,
        message: 'Please fill candidate name, designation, and appointment date.',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/appointment-letters/generate', { ...formData, showAnnexure });
      setSnackbar({
        open: true,
        message: 'Appointment Letter generated and saved successfully!',
        severity: 'success'
      });
      setTimeout(() => navigate('/documents/appointment-letter'), 1500);
    } catch (e) {
      console.error('Error saving appointment letter:', e);
      setSnackbar({
        open: true,
        message: 'Error saving Appointment Letter.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getHighlightedStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    return {
      backgroundColor: isFocused ? '#fff59d' : '#fffde7',
      borderBottom: '1px dashed #fbc02d',
      padding: '0 4px',
      borderRadius: '2px',
      fontWeight: 'bold',
      transition: 'all 0.15s ease-in-out',
      color: '#000000',
    };
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'xx/xx/xxxx';
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Global CSS for Printing pages seamlessly without layouts */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #print-container, #print-container * {
            visibility: visible;
          }
          #print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
          }
          .print-page {
            width: 100% !important;
            max-width: 100% !important;
            height: 297mm !important;
            padding: 20mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
          }
          .print-page:last-of-type {
            page-break-after: avoid !important;
          }
        }
      `}} />

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={() => navigate('/documents/appointment-letter')}
            sx={{ mb: 1, textTransform: 'none' }}
          >
            Back to Letters
          </Button>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mb: 0.5 }}>
            Appointment Letter Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate pixel-perfect multi-page appointment letters with automatic salary Annexure-I breakup.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClear}>
            Clear Form
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print / Save
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={loading}
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            }}
          >
            {loading ? 'Saving...' : 'Generate & Save'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT PANE FORM */}
        <Grid item xs={12} lg={5}>
          <Card elevation={2} sx={{ borderRadius: 3, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon color="primary" />
                Workspace Controls
              </Typography>

              {/* SECTION 1: EMPLOYEE & LETTER SETUP */}
              <Box sx={{
                mb: 3,
                p: 2.5,
                borderRadius: 2.5,
                border: '1.5px solid #eef2f6',
                background: '#fafbfc',
              }}>
                <Typography variant="subtitle2" sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  color: '#1e3c72',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px'
                }}>
                  <PersonIcon fontSize="small" />
                  Employee & Letter Setup
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="emp-select-label">Load Employee Structure</InputLabel>
                      <Select
                        labelId="emp-select-label"
                        value={formData.employeeId || ''}
                        label="Load Employee Structure"
                        onChange={(e) => handleEmployeeSelect(Number(e.target.value))}
                      >
                        {employees.map(e => (
                          <MenuItem key={e.id} value={e.id}>
                            {e.firstName} {e.lastName} ({e.employeeId})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Reference Number"
                      value={formData.referenceNumber}
                      onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                      onFocus={() => setFocusedField('referenceNumber')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Letter Date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      onFocus={() => setFocusedField('date')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Candidate Name"
                      value={formData.candidateName}
                      onChange={(e) => handleInputChange('candidateName', e.target.value)}
                      onFocus={() => setFocusedField('candidateName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address"
                      multiline
                      rows={2}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      onFocus={() => setFocusedField('address')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Designation"
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      onFocus={() => setFocusedField('designation')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Base Location"
                      value={formData.baseLocation}
                      onChange={(e) => handleInputChange('baseLocation', e.target.value)}
                      onFocus={() => setFocusedField('baseLocation')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      required
                      label="Date of Appointment"
                      value={formData.joiningDate}
                      onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      onFocus={() => setFocusedField('joiningDate')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Date of Birth"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 2: SALARY & ALLOWANCES SETUP */}
              <Box sx={{
                mb: 3,
                p: 2.5,
                borderRadius: 2.5,
                border: '1.5px solid #eef2f6',
                background: '#fafbfc',
              }}>
                <Typography variant="subtitle2" sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  color: '#1e3c72',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px'
                }}>
                  <SalaryIcon fontSize="small" />
                  Salary & Allowances Setup
                </Typography>

                 <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(30, 60, 114, 0.04)', p: 1.5, borderRadius: 2, border: '1px solid rgba(30, 60, 114, 0.08)' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showAnnexure}
                            onChange={(e) => setShowAnnexure(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e3c72' }}>Include Annexure Page in Letter</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2 }}>Includes salary breakup details in the print & PDF download.</Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}><Chip label="Salary break-up components (Monthly)" size="small" color="primary" sx={{ fontWeight: 'bold' }} /></Divider>
                  </Grid>

                  {/* Basic */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      type="number"
                      label="Basic Salary"
                      value={salaryInputs.basic || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, basic: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* HRA */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      type="number"
                      label="HRA"
                      value={salaryInputs.hra || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, hra: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* Other Allowances */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      type="number"
                      label="Other Allowances"
                      value={salaryInputs.otherAllowances || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, otherAllowances: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* Monthly Leave Encashment */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Monthly Leave Encashment"
                      value={salaryInputs.leaveEncashment || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, leaveEncashment: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* Advance Bonus */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Advance Bonus"
                      value={salaryInputs.advanceBonus || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, advanceBonus: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* Professional Tax */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Professional Tax"
                      value={salaryInputs.pTax || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, pTax: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* Uniform Charges */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Uniform Charges"
                      value={salaryInputs.uniformCharges || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, uniformCharges: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* LWF Self */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="LWF (Self Contribution)"
                      value={salaryInputs.lwfSelf || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, lwfSelf: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* LWF Company */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="LWF (Company Contribution)"
                      value={salaryInputs.lwfCompany || ''}
                      onChange={(e) => setSalaryInputs(prev => ({ ...prev, lwfCompany: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  {/* Toggles */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={salaryInputs.usePfCap}
                            onChange={(e) => setSalaryInputs(prev => ({ ...prev, usePfCap: e.target.checked }))}
                            color="secondary"
                            size="small"
                          />
                        }
                        label={<Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Limit PF to 15,000 Basic (Cap)</Typography>}
                      />
                    </Box>
                  </Grid>

                  {/* Real-time Summary Cards in Form */}
                  <Grid item xs={12}>
                    <Box sx={{ mt: 1, mb: 1, p: 2, bgcolor: '#f5f7ff', borderRadius: 3, border: '1px solid rgba(30, 60, 114, 0.08)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e3c72', mb: 1, fontSize: '0.875rem' }}>Calculator Summary</Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Gross (Monthly)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>₹ {formData.grossSalary.toLocaleString('en-IN')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Gross (Yearly)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>₹ {(formData.grossSalary * 12).toLocaleString('en-IN')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Take Home (Monthly)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '0.875rem' }}>₹ {formData.netAmount.toLocaleString('en-IN')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Total CTC (Yearly)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.875rem' }}>₹ {formData.yearlyCTC.toLocaleString('en-IN')}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 3: SIGNATURES & VERIFICATION */}
              <Box sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: '1.5px solid #eef2f6',
                background: '#fafbfc',
              }}>
                <Typography variant="subtitle2" sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  color: '#1e3c72',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px'
                }}>
                  <FingerprintIcon fontSize="small" />
                  Signatures & Verification
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Aadhaar Number"
                      value={formData.aadhaarNumber}
                      onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                      inputProps={{ maxLength: 12 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Acceptance Date"
                      value={formData.acceptanceDate}
                      onChange={(e) => handleInputChange('acceptanceDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Candidate Signature (Base64 Image URL)"
                      value={formData.candidateSignature || ''}
                      onChange={(e) => handleInputChange('candidateSignature', e.target.value)}
                      placeholder="data:image/png;base64,..."
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT PANE: REAL-TIME PREVIEW CONTAINER */}
        <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
          <Box id="print-container" sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: '210mm' }}>

            {/* ==================== PAGE 1 ==================== */}
            <Paper className="print-page" elevation={3} sx={{
              width: '100%',
              minHeight: '297mm',
              padding: '20mm',
              boxSizing: 'border-box',
              background: '#ffffff',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '12.5pt',
              lineHeight: 1.6,
              color: '#000000',
              position: 'relative',
              border: '1px solid #e0e0e0',
            }}>
              {/* Spacer for pre-printed letterhead header */}
              <Box sx={{ height: '100px' }} />

              {/* Reference and Date */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}>
                  Ref: <span style={getHighlightedStyle('referenceNumber')}>{formData.referenceNumber}</span>
                </Typography>
                <Typography sx={{ fontFamily: 'inherit' }}>
                  Date : <span style={getHighlightedStyle('date')}>{formatDateDisplay(formData.date)}</span>
                </Typography>
              </Box>

              {/* To Section */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontFamily: 'inherit' }}>To,</Typography>
                <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}>
                  Mr./Miss. <span style={getHighlightedStyle('candidateName')}>{formData.candidateName || 'Candidate Name'}</span>
                </Typography>
                <Box style={getHighlightedStyle('address')} sx={{ display: 'block', minHeight: '30px', whiteSpace: 'pre-line' }}>
                  {formData.address || 'Address Line 1\nAddress Line 2'}
                </Box>
              </Box>

              {/* Subject Title */}
              <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', textAlign: 'center', mb: 3, textDecoration: 'underline' }}>
                APPOINTMENT LETTER
              </Typography>

              {/* Greeting */}
              <Typography sx={{ fontFamily: 'inherit', mb: 2 }}>
                Dear <span style={getHighlightedStyle('candidateName')}>{formData.candidateName ? formData.candidateName.split(' ')[0] : 'Candidate'}</span>,
              </Typography>

              {/* Intro Text */}
              <Typography sx={{ fontFamily: 'inherit', mb: 3, textAlign: 'justify' }}>
                This has reference to your application and the subsequent discussions you had with us. We are pleased to appoint you on the following terms and conditions:
              </Typography>

              {/* Points 1 to 5 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>1.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Position:</strong> You are being appointed as "<span style={getHighlightedStyle('designation')}>{formData.designation || 'Designation'}</span>".
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>2.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    You will be initially based at <span style={getHighlightedStyle('baseLocation')}>{formData.baseLocation || 'Location'}</span>.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>3.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    Your appointment is subject to you being medically fit at all times.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>4.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Date of Appointment:</strong> <span style={getHighlightedStyle('joiningDate')}>{formatDateDisplay(formData.joiningDate)}</span>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>5.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Compensation and Benefits:</strong> You will receive compensation of Rs.{' '}
                    <span style={getHighlightedStyle('grossSalary')}>{Number(formData.yearlyCTC || 0).toLocaleString('en-IN')}</span> /- (Rupees{' '}
                    <span style={getHighlightedStyle('ctcWord')}>{formData.ctcWord || 'Breakup Words'}</span>) per annum as outlined in the attached sheet (Annexure-I). Income Tax or any other statutory deductions will be done at source. You will be eligible for leave and other such benefits in accordance with the Company’s rules and regulations. The perquisites applicable to your grade are subject to alteration and amendment, and you will be entitled to the same as per the rules of the company. It is in the terms and conditions that your salary should be kept confidential and should not be disclosed to anyone in or outside the organization.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>6.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Posting & Transfer:</strong> Your place of work, in the first instant, is as indicated above. However, you can be transferred temporarily or permanently for duty anywhere in India, depending upon the needs of the organization. Your service may be transferred to any office of the Company or its associate organizations in the country depending upon the exigencies of work. You will be governed by the transfer rules prevailing in the company at any given point of time.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>7.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Probation:</strong> You will be on probation for a period of 6 months, from your date of joining, after which your performance will be appraised. You will be confirmed in your appointment in writing on successful completion of the said probationary period. It may get extended by further period of 6 months if your performance is not found satisfactory. If no confirmation is made in writing at the end of the probationary period, it will be deemed to have been extended until the company confirms you in writing.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* ==================== PAGE 2 ==================== */}
            <Paper className="print-page" elevation={3} sx={{
              width: '100%',
              minHeight: '297mm',
              padding: '20mm',
              boxSizing: 'border-box',
              background: '#ffffff',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '12.5pt',
              lineHeight: 1.6,
              color: '#000000',
              border: '1px solid #e0e0e0',
            }}>
              {/* Spacer for pre-printed letterhead header */}
              <Box sx={{ height: '100px' }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.8 }}>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>8.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    During the probation period either party may terminate this agreement by giving 07 days’ notice or salary in lieu thereof is given.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>9.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Notice period:</strong> After confirmation, either party, by stating their intention to do so, in writing may terminate this employment at any time, provided that at least two month’s notice or salary in lieu thereof is given.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>10.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    However, in the event of you being guilty of misconduct or inattention or negligence in the discharge of your duties or in the conduct of the Company’s business, or such misdemeanor which is likely to affect, or affects the reputation of the Company’s working or of any breach of the terms and conditions herein, the Company reserves its right to terminate your services at any given point of time, with immediate effect, without any compensation or notice.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>11.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Date of Birth:</strong> The date of birth declared by you is <span style={getHighlightedStyle('dob')}>{formatDateDisplay(formData.dob)}</span> and you will be bound by this date of birth in all service matters with the Company.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>12.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    <strong>Retirement Age:</strong> You will retire from the services of the Company on attaining the age of 58 years.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>13.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    You will treat matters pertaining to the Company's business interests with utmost confidentiality and such confidentiality has to be maintained during your employment with the Company and thereafter.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>14.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    During your services with the company, you will be governed by the rules and regulations in respect to conduct & discipline and other matters as may be framed by the company from time to time.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>15.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    You will not, at any time, work against the interest of the company or otherwise act, in the manner, which may adversely affect the interest of the Company. You shall work conscientiously in the interest of the Management and shall utilize your ordinary prudence and intelligence in the discharge of the duties. Any violation of this norm shall constitute a gross misconduct for which the Management shall be competent to terminate your services.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>16.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    Your increment and future prospects in the company shall extremely depend on your efficiency, hard work, regular attendance punctuality, sincerely good conduct, company performance and such other relevant as adjudged by the management. Generally, employee’s performance is reviewed once a year.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* ==================== PAGE 3 ==================== */}
            <Paper className="print-page" elevation={3} sx={{
              width: '100%',
              minHeight: '297mm',
              padding: '20mm',
              boxSizing: 'border-box',
              background: '#ffffff',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '12.5pt',
              lineHeight: 1.6,
              color: '#000000',
              border: '1px solid #e0e0e0',
            }}>
              {/* Spacer for pre-printed letterhead header */}
              <Box sx={{ height: '100px' }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.8 }}>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>17.</Typography>
                  <Box sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    You will undertake, that while in the employment of the Company, and for a period of 12 months after separation from the Company, for any reason whatsoever, you will:
                    <Typography sx={{ ml: 3, mt: 1, fontFamily: 'inherit', fontSize: '10.5pt', textAlign: 'justify' }}>
                      I. Keep confidential and not disclose to any unauthorized persons<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;(a) All Company information, business and financial interests,<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;(b) Company intelligence, consisting of sensitive research, either acquired or in the process of being carried out<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;(c) Technical capability and<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;(d) Commercial intelligence disclosed to you and/ or acquired by you in the course of your employment.<br />
                      II. Not employ, use and/ or engage the confidential information for any purposes other than the business of the Company and only during the course of your employment with the Company.<br />
                      III. Not seek or obtain employment or consultancy directly or indirectly with any other Company entity/ organization or their associates/ affiliates, which is in competition with Company Name Cogent Logistics Pvt Ltd.<br />
                      IV. Solicit or endeavor to entice any employee or person involved, directly or indirectly, from any of the Company's operations.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', mt: 1 }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>18.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    You are employed in the Company full time. You will not be employed by any other Company or offer your services with or without pay to any physical person, legal entity or public authority or to be occupied in your own business without the prior written permission of the Company.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>19.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    Amendments to the above terms and conditions, if any will be made in writing.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', width: '30px' }}>20.</Typography>
                  <Typography sx={{ fontFamily: 'inherit', textAlign: 'justify' }}>
                    Please sign and return the duplicate copy of this letter of appointment (initialing each page) as a token of your acceptance the above terms and conditions.
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ fontFamily: 'inherit', mt: 4, mb: 1 }}>
                Wish you all the very best in your new assignment.
              </Typography>
              <Typography sx={{ fontFamily: 'inherit', mb: 4 }}>
                Thanking You
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Box>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}>For Cogent Logistics Pvt Ltd</Typography>
                  {/* Authorized Signatory signature space */}
                  <Box sx={{ height: '30px', mt: '10px' }} />
                  <Typography sx={{ fontFamily: 'inherit', fontSize: '9.5pt', mt: 2, fontStyle: 'italic' }} color="text.secondary">
                    (Authorized Signatory)
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold' }}>Accepted & Agreed</Typography>
                  {formData.candidateSignature && (
                    <img
                      src={formData.candidateSignature}
                      alt="Candidate Signature"
                      style={{ maxWidth: '100px', display: 'block', marginTop: '10px', height: '30px', marginLeft: 'auto' }}
                    />
                  )}
                  <Typography sx={{ fontFamily: 'inherit', fontSize: '9.5pt', mt: 2, fontStyle: 'italic' }} color="text.secondary">
                    (Name & Signature)
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* ==================== PAGE 4 (ANNEXURE - I) ==================== */}
            {showAnnexure && (
              <Paper className="print-page" elevation={3} sx={{
              width: '100%',
              minHeight: '297mm',
              padding: '20mm',
              boxSizing: 'border-box',
              background: '#ffffff',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '10.5pt',
              lineHeight: 1.4,
              color: '#000000',
              border: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Spacer for pre-printed letterhead header */}
              <Box sx={{ height: '100px' }} />

              {/* Title */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: '13pt', fontFamily: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}>
                  ANNEXURE - I (Salary Breakup Details)
                </Typography>
                <Typography sx={{ fontSize: '10pt', fontFamily: 'inherit', fontStyle: 'italic', color: '#666', mt: 0.5 }}>
                  Candidate Name: Mr./Ms. {capitalizeWords(formData.candidateName) || '...............................'}
                </Typography>
              </Box>

              {/* The salary table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'sans-serif', fontSize: '9.5pt', border: '1.5px solid #000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f4ff', borderBottom: '1.5px solid #000' }}>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', width: '8%' }}>S.No.</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', width: '52%' }}>Description</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', width: '20%' }}>Per Month (₹)</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', width: '20%' }}>Yearly (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Section I: Gross Salary */}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>I</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>Basic</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.basicSalary)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCellVal(formData.basicSalary * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>HRA</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.hra)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.hra * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Other Allowances</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.otherAllowances)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.otherAllowances * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Monthly_Leave_Encashment</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.leaveEncashment)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.leaveEncashment * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Advance_Bonus</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.advanceBonus)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.advanceBonus * 12)}</td>
                  </tr>
                  {/* Gross Salary total */}
                  <tr style={{ backgroundColor: '#e2ebf0', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Gross Salary on Pay Slip (A)</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.grossSalary)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.grossSalary * 12)}</td>
                  </tr>

                  {/* Spacer row */}
                  <tr style={{ height: '6px' }}><td colSpan={4} style={{ border: '1px solid #000', padding: 0, backgroundColor: '#fafafa' }}></td></tr>

                  {/* Section II: Deductions */}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>II</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>P.F.Deduction (Self Contribution)</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.emyPF)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCellVal(formData.emyPF * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>ESI Deduction (Self Contribution)</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.emyESIC)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.emyESIC * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Professional Tax</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.pTax)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.pTax * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Labor Welfare Fund</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.lwfEmployee)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.lwfEmployee * 12)}</td>
                  </tr>
                  {/* Gross Deduction total */}
                  <tr style={{ backgroundColor: '#e2ebf0', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Gross Deduction (B)</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.totalDeductions)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.totalDeductions * 12)}</td>
                  </tr>
                  {/* Employee Take Home Salary */}
                  <tr style={{ backgroundColor: '#222222', color: '#ffffff', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', color: '#ffffff' }}>Employee Take Home Salary (C=A-B)</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.netAmount)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.netAmount * 12)}</td>
                  </tr>

                  {/* Spacer row */}
                  <tr style={{ height: '6px' }}><td colSpan={4} style={{ border: '1px solid #000', padding: 0, backgroundColor: '#fafafa' }}></td></tr>

                  {/* Section III: Company's Contribution */}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>III</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>P.F.Deduction (Company's Contribution)</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.emrPF + formData.emrAdminCharges)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCellVal((formData.emrPF + formData.emrAdminCharges) * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>ESI Deduction (Company's Contribution)</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.emrESIC)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.emrESIC * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Gratuity *</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.gratuity)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.gratuity * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Uniform Charges</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.uniformCharges)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.uniformCharges * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Labor Welfare Fund</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.lwfEmployer)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.lwfEmployer * 12)}</td>
                  </tr>
                  {/* Company's Additional Cost total */}
                  <tr style={{ backgroundColor: '#e2ebf0', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Company's Additional Cost</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.totalEMRContribution)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.totalEMRContribution * 12)}</td>
                  </tr>
                  {/* Total CTC of Company */}
                  <tr style={{ backgroundColor: '#222222', color: '#ffffff', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', color: '#ffffff' }}>Total CTC of Company</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.monthlyCTC)}</td>
                    <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(formData.yearlyCTC)}</td>
                  </tr>
                  {/* Gratuity Note */}
                  <tr>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', textAlign: 'left' }}>
                      * Gratuity - will be applicable after continuous 5 years of service as per the applicable laws.
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Regards bottom layout block */}
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-start', pb: 0.5, pt: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontSize: '11pt', fontFamily: 'inherit', textAlign: 'left' }}>Regards,</Typography>
                  <Typography sx={{ fontSize: '11pt', fontFamily: 'inherit', fontWeight: 'bold', fontStyle: 'italic', color: '#1e3c72', mt: 0.5, textAlign: 'left' }}>
                    For Cogent Logistics Private Limited
                  </Typography>
                  <Box sx={{ py: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ borderBottom: '1px dotted rgba(0,0,0,0.25)', width: '130px', height: '18px' }} />
                    <Typography sx={{ fontSize: '10pt', fontFamily: 'inherit', fontWeight: 'bold', color: '#555555', mt: 0.5, textAlign: 'left' }}>
                      Authorized Signatory
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
            )}

          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppointmentLetterWorkspace;
