// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import {
  Print as PrintIcon,
  Clear as ClearIcon,
  AutoFixHigh as MagicIcon,
} from '@mui/icons-material';
import api, { IMAGE_BASE_URL } from '../../services/api';

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

// --- Format Indian Currency Figure ---
const formatIndianCurrency = (val: string): string => {
  const cleanVal = val.replace(/,/g, '');
  if (!cleanVal || isNaN(Number(cleanVal))) return val;
  const num = Number(cleanVal);
  return num.toLocaleString('en-IN');
};

const LetterGenerationForm: React.FC = () => {
  // Input fields state
  const [formData, setFormData] = useState({
    letterDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    candidateName: '',
    address: '',
    greetingName: '',
    position: '',
    location: 'Gurgaon',
    ctcFigure: '',
    ctcWord: '',
    joiningDate: '',
    signatoryName: 'Authorized Signatory',
    companyName: 'Cogent Logistics Private Limited'
  });

  // Track print layout options (plain paper vs pre-printed letterhead) - Default to true for user pre-printed letterhead
  const [hideHeaderInPrint, setHideHeaderInPrint] = useState(true);

  // Highlight/focus tracking for interactive live preview
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Feedback snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  // Excel-based Salary break-up states
  const [useSalaryBreakup, setUseSalaryBreakup] = useState(false);
  const [showAnnexure, setShowAnnexure] = useState(true);
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

  // Derived calculations based on salaryInputs matching Excel structure
  const getSalaryCalculations = () => {
    const basicMonth = Number(salaryInputs.basic) || 0;
    const hraMonth = Number(salaryInputs.hra) || 0;
    const otherMonth = Number(salaryInputs.otherAllowances) || 0;
    const leaveMonth = Number(salaryInputs.leaveEncashment) || 0;
    const advanceMonth = Number(salaryInputs.advanceBonus) || 0;
    const pTaxMonth = Number(salaryInputs.pTax) || 0;
    const uniformChargesMonth = Number(salaryInputs.uniformCharges) || 0;
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
    let pfSelfYear = 0;
    if (salaryInputs.usePfCap) {
      pfSelfMonth = basicMonth > 15000 ? 1800 : Math.round(basicMonth * 0.12);
      pfSelfYear = basicYear > 180000 ? 21600 : Math.round(basicYear * 0.12);
    } else {
      pfSelfMonth = Math.round(basicMonth * 0.12);
      pfSelfYear = Math.round(basicYear * 0.12);
    }

    const esicSelfMonth = grossMonth < 21001 ? Math.round(grossMonth * 0.0075) : 0;
    const esicSelfYear = grossYear < 252012 ? Math.round(grossYear * 0.0075) : 0;

    const pTaxYear = pTaxMonth * 12;
    const lwfSelfYear = lwfSelfMonth * 12;
    const uniformChargesYear = uniformChargesMonth * 12;

    const grossDeductionMonth = pfSelfMonth + esicSelfMonth + pTaxMonth + lwfSelfMonth;
    const grossDeductionYear = pfSelfYear + esicSelfYear + pTaxYear + lwfSelfYear;

    const takeHomeMonth = grossMonth - grossDeductionMonth;
    const takeHomeYear = grossYear - grossDeductionYear;

    let pfCompanyMonth = 0;
    let pfCompanyYear = 0;
    if (salaryInputs.usePfCap) {
      pfCompanyMonth = basicMonth > 15000 ? 1950 : Math.round(basicMonth * 0.13);
      pfCompanyYear = basicYear > 180000 ? 23400 : Math.round(basicYear * 0.13);
    } else {
      pfCompanyMonth = Math.round(basicMonth * 0.13);
      pfCompanyYear = Math.round(basicYear * 0.13);
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

    return {
      basicMonth, basicYear,
      hraMonth, hraYear,
      otherMonth, otherYear,
      leaveMonth, leaveYear,
      advanceMonth, advanceYear,
      grossMonth, grossYear,
      pfSelfMonth, pfSelfYear,
      esicSelfMonth, esicSelfYear,
      pTaxMonth, pTaxYear,
      uniformChargesMonth, uniformChargesYear,
      lwfSelfMonth, lwfSelfYear,
      grossDeductionMonth, grossDeductionYear,
      takeHomeMonth, takeHomeYear,
      pfCompanyMonth, pfCompanyYear,
      esicCompanyMonth, esicCompanyYear,
      gratuityMonth, gratuityYear,
      lwfCompanyMonth, lwfCompanyYear,
      companyAdditionalCostMonth, companyAdditionalCostYear,
      totalCtcMonth, totalCtcYear
    };
  };

  const calcs = getSalaryCalculations();

  const formatCellVal = (val: number) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
    return formatIndianCurrency(Math.round(val).toString());
  };

  // Watch candidateName changes to auto-update greeting name
  useEffect(() => {
    if (formData.candidateName) {
      const firstName = formData.candidateName.split(' ')[0];
      setFormData(prev => ({
        ...prev,
        greetingName: firstName
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        greetingName: ''
      }));
    }
  }, [formData.candidateName]);

  // Watch ctcFigure changes to auto-update ctcWord
  useEffect(() => {
    const rawVal = formData.ctcFigure.replace(/,/g, '');
    if (rawVal && !isNaN(Number(rawVal))) {
      const words = numberToIndianWords(Number(rawVal));
      setFormData(prev => ({
        ...prev,
        ctcWord: words
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        ctcWord: ''
      }));
    }
  }, [formData.ctcFigure]);

  // Dynamic link: Auto-update ctcFigure in the letter when Salary Breakdown Calculator is active
  useEffect(() => {
    if (useSalaryBreakup) {
      setFormData(prev => ({
        ...prev,
        ctcFigure: formatIndianCurrency(calcs.totalCtcYear.toString())
      }));
    }
  }, [calcs.totalCtcYear, useSalaryBreakup]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFigureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    handleInputChange('ctcFigure', formatIndianCurrency(rawVal));
  };

  const handleClear = () => {
    setFormData({
      letterDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      candidateName: '',
      address: '',
      greetingName: '',
      position: '',
      location: 'Gurgaon',
      ctcFigure: '',
      ctcWord: '',
      joiningDate: '',
      signatoryName: 'Authorized Signatory',
      companyName: 'Cogent Logistics Private Limited'
    });

    setSalaryInputs({
      basic: 16868,
      hra: 8434,
      otherAllowances: 3755,
      leaveEncashment: 0,
      advanceBonus: 0,
      pTax: 0,
      lwfSelf: 0,
      lwfCompany: 0,
      usePfCap: false,
    });
    setUseSalaryBreakup(false);

    setSnackbar({
      open: true,
      message: 'Form cleared successfully',
      severity: 'info'
    });
  };

  const handlePrint = async () => {
    if (!formData.candidateName || !formData.position || !formData.ctcFigure || !formData.joiningDate) {
      setSnackbar({
        open: true,
        message: 'Please fill in Name, Position, CTC and Joining Date before printing',
        severity: 'warning'
      });
      return;
    }

    try {
      // Save offer letter data into MySQL hrms_offer_letters
      await api.post('/api/offer-letters/save', {
        ...formData,
        salaryInputs,
        useSalaryBreakup,
        showAnnexure,
        calcs
      });

      setSnackbar({
        open: true,
        message: 'Offer letter saved to database & print layout generated!',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error saving offer letter to DB:', err);
      // Still allow print even if saving failed
    }

    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getHighlightedStyle = (field: string) => {
    const isActive = focusedField === field;
    return {
      backgroundColor: isActive ? 'rgba(255, 235, 59, 0.45)' : 'transparent',
      padding: isActive ? '1px 4px' : '0px',
      borderRadius: isActive ? '4px' : '0px',
      transition: 'all 0.3s ease',
      borderBottom: isActive ? '2px solid #ff9800' : 'none',
      display: 'inline',
      fontWeight: isActive ? 600 : 'inherit',
    };
  };

  const capitalizeWords = (str: string) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '...............................';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;

    // Add ordinal suffix for day
    const day = dateObj.getDate();
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';

    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
    const yearStr = dateObj.getFullYear();
    return `${day}${suffix} ${monthStr} ${yearStr}`;
  };

  const checklistItems = [
    'Date of Birth certificate,(Class X Certificate)',
    'Class XII Mark sheet.',
    'Qualifying certificate and mark sheets of your professional qualifications.',
    'Last salary slips from the previous organization. (If applicable)',
    'Clearance/Non-Dues certificate & resignation acceptance letter from previous employer.',
    'Four passport size photos, one each for dependents.',
    'Copy of the Pan Card & Aadhar Card.',
    'Address proof copy of Ration Card / Voter Card/Passport.',
    'Any other documents, as and when required.'
  ];

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      {/* Global CSS for printing perfect single A4 sheets */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
            max-width: 100% !important;
            margin: 0;
            padding: 0;
            background: white !important;
            box-shadow: none !important;
          }
          .print-page {
            width: 100% !important;
            max-width: 100% !important;
            height: 297mm;
            max-height: 297mm;
            display: flex !important;
            flex-direction: column !important;
            padding: ${hideHeaderInPrint ? '55mm' : '12mm'} 20mm ${hideHeaderInPrint ? '30mm' : '10mm'} 20mm !important;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            position: relative;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
          .print-page:last-of-type {
            page-break-after: avoid !important;
          }
          .print-header {
            display: ${hideHeaderInPrint ? 'none' : 'flex'} !important;
          }
          .print-footer {
            display: none !important;
          }
        }
      `}} />

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(45deg, #1e3c72 0%, #2a5298 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.5 }}>
            Offer Letter Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Develop and print pixel-perfect single-page offer letters with real-time formatting.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
          >
            Clear Form
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 4px 14px rgba(30, 60, 114, 0.3)',
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #122548 0%, #1e3c72 100%)',
              }
            }}
          >
            Print / Save PDF
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: Modern Glassmorphic Form Inputs */}
        <Grid item xs={12} lg={5}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              position: 'sticky',
              top: 24,
              zIndex: 10,
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="700" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MagicIcon fontSize="small" /> Letter Details
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              {/* Dynamic print letterhead toggler */}
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(30, 60, 114, 0.04)', p: 1.5, borderRadius: 2, border: '1px solid rgba(30, 60, 114, 0.08)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={hideHeaderInPrint}
                      onChange={(e) => setHideHeaderInPrint(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e3c72' }}>Print on Pre-printed Letterhead</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2 }}>Hides corporate header for physical paper.</Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                />
              </Box>

              <Grid container spacing={2}>
                {/* 1. Date */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Offer Date"
                    value={formData.letterDate}
                    onChange={(e) => handleInputChange('letterDate', e.target.value)}
                    onFocus={() => setFocusedField('letterDate')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Dec 23rd, 2025"
                  />
                </Grid>

                {/* 2. Candidate Name */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Candidate Name"
                    value={formData.candidateName}
                    onChange={(e) => handleInputChange('candidateName', e.target.value)}
                    onFocus={() => setFocusedField('candidateName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Mr. Kishore Kumar"
                  />
                </Grid>

                {/* 3. Address */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Address"
                    multiline
                    rows={2.5}
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Line 1&#10;Line 2&#10;Line 3"
                  />
                </Grid>

                {/* 4. Greeting Name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Greeting Name"
                    value={formData.greetingName}
                    onChange={(e) => handleInputChange('greetingName', e.target.value)}
                    onFocus={() => setFocusedField('greetingName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Kishore"
                    helperText="Auto-populated, editable."
                  />
                </Grid>

                {/* 5. Position */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Position / Designation"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    onFocus={() => setFocusedField('position')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Senior Logistics Coordinator"
                  />
                </Grid>

                {/* 6. Location */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    onFocus={() => setFocusedField('location')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Gurgaon"
                  />
                </Grid>

                {/* Toggle Switch */}
                <Grid item xs={12}>
                  <Box sx={{ my: 1, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(102, 126, 234, 0.05)', p: 1.5, borderRadius: 2, border: '1px solid rgba(102, 126, 234, 0.1)' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useSalaryBreakup}
                          onChange={(e) => setUseSalaryBreakup(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>Use Salary Breakup Calculator</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2 }}>Calculates Gross, Deductions, PF, ESI, Gratuity & CTC automatically.</Typography>
                        </Box>
                      }
                      sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                    />
                  </Box>
                </Grid>

                {useSalaryBreakup && (
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(30, 60, 114, 0.04)', p: 1.5, borderRadius: 2, border: '1px solid rgba(30, 60, 114, 0.08)' }}>
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
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2 }}>Show salary breakdown page in print layout.</Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                      />
                    </Box>
                  </Grid>
                )}

                {useSalaryBreakup ? (
                  <>
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
                      <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: '#f5f7ff', borderRadius: 3, border: '1px solid rgba(30, 60, 114, 0.08)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e3c72', mb: 1, fontSize: '0.875rem' }}>Calculator Summary</Typography>
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Gross (Monthly)</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>₹ {calcs.grossMonth.toLocaleString('en-IN')}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Gross (Yearly)</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>₹ {calcs.grossYear.toLocaleString('en-IN')}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Take Home (Monthly)</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '0.875rem' }}>₹ {calcs.takeHomeMonth.toLocaleString('en-IN')}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">Total CTC (Yearly)</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.875rem' }}>₹ {calcs.totalCtcYear.toLocaleString('en-IN')}</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </>
                ) : null}

                {/* 7. CTC in Figure */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    label="Annual CTC (in Figure)"
                    value={formData.ctcFigure}
                    onChange={handleFigureChange}
                    onFocus={() => setFocusedField('ctcFigure')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. 5,00,000"
                    disabled={useSalaryBreakup}
                    InputProps={{
                      readOnly: useSalaryBreakup,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '10pt' }}>₹</Typography>
                        </InputAdornment>
                      ),
                    }}
                    helperText={useSalaryBreakup ? "Auto-calculated from breakup components." : ""}
                  />
                </Grid>

                {/* 8. CTC in Word */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Annual CTC (in Word)"
                    value={formData.ctcWord}
                    onChange={(e) => handleInputChange('ctcWord', e.target.value)}
                    onFocus={() => setFocusedField('ctcWord')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Five Lakh Only"
                    disabled={useSalaryBreakup}
                    InputProps={{
                      readOnly: useSalaryBreakup
                    }}
                    helperText={useSalaryBreakup ? "Auto-computed from CTC figure." : "Auto-computed in Indian numbering format."}
                  />
                </Grid>

                {/* 9. Date of Joining */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    type="date"
                    label="Date of Joining"
                    value={formData.joiningDate}
                    onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                    onFocus={() => setFocusedField('joiningDate')}
                    onBlur={() => setFocusedField(null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: Realistic Live Print Preview */}
        <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>

          {/* Real-time binds container */}
          <Box id="print-container" sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '210mm' }}>

            {/* --- SINGLE PAGE SHEET --- */}
            <Paper
              className="print-page"
              elevation={3}
              sx={{
                width: '100%',
                height: '297mm',
                maxHeight: '297mm',
                padding: hideHeaderInPrint ? '55mm 20mm 30mm 20mm' : '12mm 20mm 10mm 20mm',
                boxSizing: 'border-box',
                background: '#ffffff',
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: '12.5pt',
                lineHeight: 1.4,
                color: '#222222',
                position: 'relative',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* On-screen Watermarked Pre-printed Header (Only visible on screen, hidden in print) */}
              {hideHeaderInPrint && (
                <Box className="print-header" sx={{
                  position: 'absolute',
                  top: '10mm',
                  left: '18mm',
                  right: '18mm',
                  opacity: 0.3,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1.5px solid #000',
                  pb: 0.8,
                  zIndex: 10
                }}>
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontFamily: '"Arial Black", sans-serif', fontWeight: 900, color: '#1e3c72', display: 'flex', alignItems: 'center', letterSpacing: '-1px' }}>
                      c<span style={{ color: '#00c6ff', fontSize: '26px' }}>●</span>gent<span style={{ fontSize: '11px', verticalAlign: 'super', marginLeft: '2px', fontWeight: 'normal' }}>es</span>
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'left', pl: 2, borderLeft: '1px solid #ccc' }}>
                    <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '10pt', fontWeight: 'bold', color: '#1e3c72', lineHeight: 1.1 }}>
                      Cogent Logistics Private Limited
                    </Typography>
                    <Typography sx={{ fontFamily: 'sans-serif', fontSize: '7pt', color: '#555', lineHeight: 1.1 }}>
                      201C/6, Second Floor, D-21 Corporate Park, Sector.-21, Dwarka, New Delhi - 110077 India
                    </Typography>
                    <Typography sx={{ fontFamily: 'sans-serif', fontSize: '6.5pt', color: '#555', lineHeight: 1.1 }}>
                      E mail: info@cogentlogistics.in, Web: www.cogentlogistics.in, Phone: +91 11 41099971
                    </Typography>
                    <Typography sx={{ fontFamily: 'sans-serif', fontSize: '6.5pt', color: '#555', fontWeight: 'bold', lineHeight: 1.1 }}>
                      CIN No.: U63040DL2013PTC260297
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* On-screen Watermarked Pre-printed Footer (Only visible on screen, hidden in print) */}
              {hideHeaderInPrint && (
                <Box className="print-footer" sx={{
                  position: 'absolute',
                  bottom: '8mm',
                  left: '18mm',
                  right: '18mm',
                  opacity: 0.3,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: '1.5px solid #000',
                  pt: 0.8,
                  zIndex: 10,
                  textAlign: 'center'
                }}>
                  <Typography sx={{ fontFamily: 'sans-serif', fontSize: '7pt', color: '#000', fontWeight: 'bold', letterSpacing: '0.2px', lineHeight: 1.2 }}>
                    SHOP NO. 22, CSC II, DDA MARKET, INDRAPRASTHA EXTN., PATPARGANJ, OPP. BALCO APARTMENT
                  </Typography>
                  <Typography sx={{ fontFamily: 'sans-serif', fontSize: '7pt', color: '#000', fontWeight: 'bold', lineHeight: 1.2 }}>
                    East Delhi, Delhi, India, 110092
                  </Typography>
                </Box>
              )}

              {/* Header section (Uses official header image when not printing on pre-printed letterhead) */}
              {!hideHeaderInPrint && (
                <Box className="print-header" sx={{ width: '100%', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={`${IMAGE_BASE_URL}/uploads/assets/offer_header.jpeg`}
                    alt="Cogent Logistics Header"
                    style={{ width: '100%', height: 'auto', maxHeight: '115px', objectFit: 'contain' }}
                  />
                </Box>
              )}

              {/* Candidate Info & Date Row (Aligning Mr./Ms. and Date on the same horizontal line) */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                {/* Left Side: Candidate Name & Address */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, maxWidth: '65%' }}>
                  <Typography sx={{ fontSize: '12.5pt', fontFamily: 'inherit', fontWeight: 'bold' }}>
                    Mr./Ms. <span style={getHighlightedStyle('candidateName')}>{capitalizeWords(formData.candidateName) || '...............................'}</span>
                  </Typography>
                  <Typography sx={{ fontSize: '12.5pt', fontFamily: 'inherit', whiteSpace: 'pre-line', fontStyle: 'italic', pl: 1, borderLeft: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={getHighlightedStyle('address')}>{formData.address || 'Address Line 1\nAddress Line 2\nAddress Line 3'}</span>
                  </Typography>
                </Box>

                {/* Right Side: Date */}
                <Box sx={{ textAlign: 'right', pt: 0.2 }}>
                  <Typography sx={{ fontSize: '12.5pt', fontFamily: 'inherit' }}>
                    <strong>Date:</strong> <span style={getHighlightedStyle('letterDate')}>{formData.letterDate || '...............................'}</span>
                  </Typography>
                </Box>
              </Box>

              {/* Subject Line */}
              <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                <Typography sx={{ fontSize: '13.5pt', fontFamily: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}>
                  Subject: Offer Letter
                </Typography>
              </Box>

              {/* Greeting */}
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: '12.5pt', fontFamily: 'inherit' }}>
                  Dear <span style={getHighlightedStyle('greetingName')}>{capitalizeWords(formData.greetingName) || '...............................'}</span>,
                </Typography>
              </Box>

              {/* Body Paragraph 1 */}
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: '12.5pt', fontFamily: 'inherit', textAlign: 'justify' }}>
                  With reference to your application for employment and our subsequent meeting, we are pleased to inform you that you have been selected for the post of <span style={getHighlightedStyle('position')}><strong>{capitalizeWords(formData.position) || '...............................'}</strong></span> to be posted at - <span style={getHighlightedStyle('location')}><strong>{capitalizeWords(formData.location) || 'Gurgaon'}</strong></span> Location.
                </Typography>
              </Box>

              {/* Body Paragraph 2 */}
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: '12.5pt', fontFamily: 'inherit', textAlign: 'justify' }}>
                  Your CTC would be <strong>Rs. <span style={getHighlightedStyle('ctcFigure')}>{formData.ctcFigure || '...............................'}</span>/-</strong> (Rupees <span style={getHighlightedStyle('ctcWord')}><em>{formData.ctcWord || '......................................................................'}</em></span>) per annum. Other terms and conditions would be given to you with your appointment letter at the time of joining.
                </Typography>
              </Box>

              {/* Body Paragraph 3 */}
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '12.5pt', fontFamily: 'inherit', textAlign: 'justify' }}>
                  You are hereby requested to join our Company on <span style={getHighlightedStyle('joiningDate')}><strong>{formatDateString(formData.joiningDate)}</strong></span> and return a signed copy of this Offer Letter to our office within 2 days of the date of this Offer Letter, after which this Offer Letter shall no longer be valid.
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5, opacity: 0.5 }} />

              {/* Checklist Section */}
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: '11.5pt', fontFamily: 'inherit', fontWeight: 'bold' }}>
                  You are required to bring the following on the day of joining:
                </Typography>
              </Box>

              {/* Single-Column Professional Checklist Layout */}
              <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {checklistItems.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '10.5pt', minWidth: '15px' }}>{idx + 1}.</Typography>
                    <Typography sx={{ fontSize: '10.5pt', fontFamily: 'inherit', textAlign: 'justify', lineHeight: 1.25 }}>{item}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Closing note */}
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: '11.5pt', fontFamily: 'inherit', fontStyle: 'italic', color: '#444' }}>
                  We are sure that you will have a beneficial and long-term association with us. Congratulations and best of Luck!
                </Typography>
              </Box>

              {/* Regards bottom layout block */}
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start', pb: 0.5 }}>
                {/* Regards & Company Sign block */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontSize: '11.5pt', fontFamily: 'inherit' }}>Regards,</Typography>
                  <Typography sx={{ fontSize: '11.5pt', fontFamily: 'inherit', fontWeight: 'bold', fontStyle: 'italic', color: '#1e3c72', mt: 0.5 }}>
                    For Cogent Logistics Private Limited
                  </Typography>

                  <Box sx={{ py: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ borderBottom: '1px dotted rgba(0,0,0,0.25)', width: '140px', height: '22px' }} />
                    <Typography sx={{ fontSize: '10.5pt', fontFamily: 'inherit', fontWeight: 'bold', color: '#555555', mt: 0.5 }}>
                      Authorized Signatory
                    </Typography>
                  </Box>
                </Box>
              </Box>

            </Paper>

            {useSalaryBreakup && showAnnexure && (
              <Paper
                className="print-page"
                elevation={3}
                sx={{
                  width: '100%',
                  height: '297mm',
                  maxHeight: '297mm',
                  padding: hideHeaderInPrint ? '55mm 20mm 30mm 20mm' : '12mm 20mm 10mm 20mm',
                  boxSizing: 'border-box',
                  background: '#ffffff',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  fontSize: '11.5pt',
                  lineHeight: 1.3,
                  color: '#222222',
                  position: 'relative',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  mt: 3,
                }}
              >
                {/* On-screen Watermarked Pre-printed Header */}
                {hideHeaderInPrint && (
                  <Box className="print-header" sx={{
                    position: 'absolute',
                    top: '10mm',
                    left: '18mm',
                    right: '18mm',
                    opacity: 0.3,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1.5px solid #000',
                    pb: 0.8,
                    zIndex: 10
                  }}>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h5" sx={{ fontFamily: '"Arial Black", sans-serif', fontWeight: 900, color: '#1e3c72', display: 'flex', alignItems: 'center', letterSpacing: '-1px' }}>
                        c<span style={{ color: '#00c6ff', fontSize: '26px' }}>●</span>gent<span style={{ fontSize: '11px', verticalAlign: 'super', marginLeft: '2px', fontWeight: 'normal' }}>es</span>
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'left', pl: 2, borderLeft: '1px solid #ccc' }}>
                      <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '10pt', fontWeight: 'bold', color: '#1e3c72', lineHeight: 1.1 }}>
                        Cogent Logistics Private Limited
                      </Typography>
                      <Typography sx={{ fontFamily: 'sans-serif', fontSize: '7pt', color: '#555', lineHeight: 1.1 }}>
                        201C/6, Second Floor, D-21 Corporate Park, Sector.-21, Dwarka, New Delhi - 110077 India
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Header section (official header image) */}
                {!hideHeaderInPrint && (
                  <Box className="print-header" sx={{ width: '100%', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={`${IMAGE_BASE_URL}/uploads/assets/offer_header.jpeg`}
                      alt="Cogent Logistics Header"
                      style={{ width: '100%', height: 'auto', maxHeight: '115px', objectFit: 'contain' }}
                    />
                  </Box>
                )}

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
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.basicMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCellVal(calcs.basicYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>HRA</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.hraMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.hraYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Other Allowances</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.otherMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.otherYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Monthly_Leave_Encashment</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.leaveMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.leaveYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Advance_Bonus</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.advanceMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.advanceYear)}</td>
                    </tr>
                    {/* Gross Salary total */}
                    <tr style={{ backgroundColor: '#e2ebf0', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Gross Salary on Pay Slip (A)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.grossMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.grossYear)}</td>
                    </tr>

                    {/* Spacer row */}
                    <tr style={{ height: '6px' }}><td colSpan={4} style={{ border: '1px solid #000', padding: 0, backgroundColor: '#fafafa' }}></td></tr>

                    {/* Section II: Deductions */}
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>II</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>P.F.Deduction (Self Contribution)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.pfSelfMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCellVal(calcs.pfSelfYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>ESI Deduction (Self Contribution)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.esicSelfMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.esicSelfYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Professional Tax</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(salaryInputs.pTax)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.pTaxYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Labor Welfare Fund</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(salaryInputs.lwfSelf)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.lwfSelfYear)}</td>
                    </tr>
                    {/* Gross Deduction total */}
                    <tr style={{ backgroundColor: '#e2ebf0', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Gross Deduction (B)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.grossDeductionMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.grossDeductionYear)}</td>
                    </tr>
                    {/* Employee Take Home Salary */}
                    <tr style={{ backgroundColor: '#222222', color: '#ffffff', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', color: '#ffffff' }}>Employee Take Home Salary (C=A-B)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.takeHomeMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.takeHomeYear)}</td>
                    </tr>

                    {/* Spacer row */}
                    <tr style={{ height: '6px' }}><td colSpan={4} style={{ border: '1px solid #000', padding: 0, backgroundColor: '#fafafa' }}></td></tr>

                    {/* Section III: Company's Contribution */}
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>III</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>P.F.Deduction (Company's Contribution)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.pfCompanyMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCellVal(calcs.pfCompanyYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>ESI Deduction (Company's Contribution)</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.esicCompanyMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.esicCompanyYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Gratuity *</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.gratuityMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.gratuityYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Uniform Charges</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(salaryInputs.uniformCharges)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.uniformChargesYear)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Labor Welfare Fund</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(salaryInputs.lwfCompany)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.lwfCompanyYear)}</td>
                    </tr>
                    {/* Company's Additional Cost total */}
                    <tr style={{ backgroundColor: '#e2ebf0', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}>Company's Additional Cost</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.companyAdditionalCostMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.companyAdditionalCostYear)}</td>
                    </tr>
                    {/* Total CTC of Company */}
                    <tr style={{ backgroundColor: '#222222', color: '#ffffff', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #000', padding: '5px 8px' }}></td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', color: '#ffffff' }}>Total CTC of Company</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.totalCtcMonth)}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>{formatCellVal(calcs.totalCtcYear)}</td>
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
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-start', pb: 0.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '11pt', fontFamily: 'inherit' }}>Regards,</Typography>
                    <Typography sx={{ fontSize: '11pt', fontFamily: 'inherit', fontWeight: 'bold', fontStyle: 'italic', color: '#1e3c72', mt: 0.5 }}>
                      For Cogent Logistics Private Limited
                    </Typography>
                    <Box sx={{ py: 0.8, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ borderBottom: '1px dotted rgba(0,0,0,0.25)', width: '130px', height: '18px' }} />
                      <Typography sx={{ fontSize: '10pt', fontFamily: 'inherit', fontWeight: 'bold', color: '#555555', mt: 0.5 }}>
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

      {/* Snackbar feedback notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LetterGenerationForm;
