// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    TextField,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Alert,
    Snackbar,
    Divider,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Download as DownloadIcon,
    NavigateNext as NextIcon,
    NavigateBefore as BackIcon,
    Upload as UploadIcon,
    Clear as ClearIcon,
    Send as SendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, IMAGE_BASE_URL } from '../../services/api';

interface OfferLetterData {
    // Step 1: Candidate Details
    candidateName: string;
    address: string;
    date: string;
    designation: string;
    location: string;
    joiningDate: string;

    // Step 2: Salary & CTC
    calculationBasis: 'New Government Rule' | 'Old Basis';
    esicCovered: 'Yes' | 'No';
    basicSalary: number;
    hra: number;
    variableDearnessAllowance: number;
    otherAllowances: number;
    performanceBonus: number;
    leaveEncashment: number;
    advanceBonus: number;
    grossSalary: number;
    emyPF: number;
    emyESIC: number;
    pTax: number;
    lwfEmployee: number;
    totalDeductions: number;
    netAmount: number;
    emrPF: number;
    emrAdminCharges: number;
    emrESIC: number;
    lwfEmployer: number;
    gratuity: number;
    totalEMRContribution: number;
    monthlySalary: number;
    monthlyCTC: number;
    yearlyCTC: number;

    // Step 3: Acceptance Details
    acceptanceCandidateName: string;
    aadhaarNumber: string;
    acceptanceDate: string;
    candidateSignature: string | null;

    // Step 4: Additional Terms (Probation)
    probation: string;
}

const steps = ['Candidate Details', 'Salary & CTC', 'Acceptance Details'];

const OfferLetterForm: React.FC = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'warning'
    });
    const [generatedId, setGeneratedId] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<OfferLetterData>({
        candidateName: '',
        address: '',
        date: new Date().toISOString().split('T')[0],
        designation: '',
        location: '',
        joiningDate: '',
        calculationBasis: 'Old Basis',
        esicCovered: 'No',
        basicSalary: 0,
        hra: 0,
        variableDearnessAllowance: 0,
        otherAllowances: 0,
        performanceBonus: 0,
        leaveEncashment: 0,
        advanceBonus: 0,
        grossSalary: 0,
        emyPF: 0,
        emyESIC: 0,
        pTax: 0,
        lwfEmployee: 0,
        totalDeductions: 0,
        netAmount: 0,
        emrPF: 0,
        emrAdminCharges: 0,
        emrESIC: 0,
        lwfEmployer: 0,
        gratuity: 0,
        totalEMRContribution: 0,
        monthlySalary: 0,
        monthlyCTC: 0,
        yearlyCTC: 0,
        acceptanceCandidateName: '',
        aadhaarNumber: '',
        acceptanceDate: new Date().toISOString().split('T')[0],
        candidateSignature: null,
        probation: 'You shall be on probation for a period of twelve months from the date of your joining. This period may be extended further at the discretion of the management. Your appointment will be considered confirmed only after the confirmation letter by management.',
    });



    // Auto-calculate all salary components based on Gross and Basis
    React.useEffect(() => {
        const gross = Number(formData.grossSalary) || 0;

        let basic = 0;
        let hra = 0;
        let other = 0;
        let bonus = 0;

        if (formData.calculationBasis === 'Old Basis') {
            // Old Basis: Basic is Gross / 2.0833
            basic = Math.round(gross / 2.0833);
            hra = Math.round(basic * 0.5);
            bonus = Math.round(basic * 0.0833 * 10) / 10;
            other = Math.max(0, gross - (basic + hra + bonus));
        } else {
            // New Government Rule: Basic = Gross * 0.57242
            basic = Math.round(gross * 0.57242);
            hra = Math.round(basic * 0.5);
            bonus = Math.round(basic * 0.0833 * 10) / 10;
            other = Math.max(0, gross - (basic + hra + bonus));
        }

        // Deductions
        const emyPF = Math.round(basic * 0.12);
        const emyESIC = formData.esicCovered === 'Yes' && gross <= 21000 ? Math.ceil(gross * 0.0075) : 0;
        const pTax = gross > 15000 ? 200 : 0; // Standard slab example
        const lwfEmployee = formData.esicCovered === 'Yes' ? 10 : 0; // Standard nominal value
        const totalDeductions = emyPF + emyESIC + pTax + lwfEmployee;
        const netAmount = Math.round(gross - totalDeductions);

        // Employer Contributions
        const emrPF = emyPF; // 12%
        const emrAdmin = Math.round(basic * 0.01);
        const emrESIC = formData.esicCovered === 'Yes' && gross <= 21000 ? Math.ceil(gross * 0.0325) : 0;
        const lwfEmployer = formData.esicCovered === 'Yes' ? 20 : 0;
        const gratuity = Math.floor(basic * 0.0481); // Use floor to match image (721/1058)
        const totalEMR = emrPF + emrAdmin + emrESIC + lwfEmployer + gratuity;

        const monthlyCTC = gross + totalEMR;
        const yearlyCTC = Math.round(monthlyCTC * 12);

        setFormData(prev => ({
            ...prev,
            basicSalary: basic,
            hra: hra,
            otherAllowances: other,
            performanceBonus: bonus,
            emyPF,
            emyESIC,
            pTax,
            lwfEmployee,
            totalDeductions,
            netAmount,
            emrPF,
            emrAdminCharges: emrAdmin,
            emrESIC,
            lwfEmployer,
            gratuity,
            totalEMRContribution: totalEMR,
            monthlySalary: gross,
            monthlyCTC: monthlyCTC,
            yearlyCTC: yearlyCTC,
            // Auto-populate acceptance candidate name if empty
            acceptanceCandidateName: prev.acceptanceCandidateName || prev.candidateName,
        }));
    }, [formData.grossSalary, formData.calculationBasis, formData.esicCovered, formData.candidateName]);

    const handleInputChange = (field: keyof OfferLetterData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    candidateSignature: reader.result as string,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearSignature = () => {
        setFormData(prev => ({
            ...prev,
            candidateSignature: null,
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0:
                return !!(
                    formData.candidateName &&
                    formData.address &&
                    formData.date &&
                    formData.designation &&
                    formData.location &&
                    formData.joiningDate &&
                    formData.probation
                );
            case 1:
                return !!(
                    formData.grossSalary > 0 &&
                    formData.calculationBasis
                );
            case 2:
                return !!(
                    formData.acceptanceCandidateName &&
                    formData.aadhaarNumber &&
                    formData.acceptanceDate
                );
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (!validateStep(activeStep)) {
            setSnackbar({
                open: true,
                message: 'Please fill all required fields',
                severity: 'warning'
            });
            return;
        }
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleGeneratePDF = async () => {
        if (!validateStep(2)) {
            setSnackbar({
                open: true,
                message: 'Please fill all required fields',
                severity: 'warning'
            });
            return;
        }

        try {
            setLoading(true);

            // Call backend API to generate PDF
            const response = await fetch(`${API_BASE_URL}/api/offer-letters/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Offer_Letter_${formData.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: 'Offer letter generated successfully!',
                severity: 'success'
            });

            // Capture the generated ID from header
            const offerLetterId = response.headers.get('X-Offer-Letter-Id');
            if (offerLetterId) {
                setGeneratedId(parseInt(offerLetterId));
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            setSnackbar({
                open: true,
                message: 'Error generating PDF. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendToEmployee = async () => {
        if (!generatedId) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/offer-letters/${generatedId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'Sent' }),
            });

            if (!response.ok) {
                throw new Error('Failed to send offer letter');
            }

            setSnackbar({
                open: true,
                message: 'Offer letter sent to employee successfully!',
                severity: 'success'
            });

            // Reset form after a delay
            setTimeout(() => {
                navigate('/documents/offer-letter');
            }, 2000);

        } catch (error) {
            console.error('Error sending offer letter:', error);
            setSnackbar({
                open: true,
                message: 'Error sending offer letter. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Candidate Name"
                                value={formData.candidateName}
                                onChange={(e) => handleInputChange('candidateName', e.target.value)}
                                placeholder="Enter candidate's full name"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Address"
                                multiline
                                rows={3}
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Enter complete address"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                label="Date"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Designation"
                                value={formData.designation}
                                onChange={(e) => handleInputChange('designation', e.target.value)}
                                placeholder="e.g., Asst. Manager - Business Development"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Location"
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                placeholder="e.g., New Delhi"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                label="Joining Date"
                                value={formData.joiningDate}
                                onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="PROBATION & BOND"
                                multiline
                                rows={4}
                                value={formData.probation}
                                onChange={(e) => handleInputChange('probation', e.target.value)}
                                placeholder="Enter probation and bond details"
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Select the calculation basis and enter the monthly gross salary. Components will be calculated automatically.
                            </Alert>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                select
                                label="Salary Calculation Basis"
                                value={formData.calculationBasis}
                                onChange={(e) => handleInputChange('calculationBasis', e.target.value)}
                                SelectProps={{ native: true }}
                            >
                                <option value="Old Basis">Old Basis</option>
                                <option value="New Government Rule">New Government Rule</option>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                select
                                label="ESIC Covered"
                                value={formData.esicCovered}
                                onChange={(e) => handleInputChange('esicCovered', e.target.value)}
                                SelectProps={{ native: true }}
                            >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Monthly Gross Salary"
                                value={formData.grossSalary || ''}
                                onChange={(e) => handleInputChange('grossSalary', parseFloat(e.target.value) || 0)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Basic Salary"
                                value={formData.basicSalary || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="HRA"
                                value={formData.hra || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Bonus (8.33%)"
                                value={formData.performanceBonus || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Other Allowances"
                                value={formData.otherAllowances || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Employee PF"
                                value={formData.emyPF || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Employee ESIC"
                                value={formData.emyESIC || '0'}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="P.Tax"
                                value={formData.pTax || '0'}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="LWF (EE)"
                                value={formData.lwfEmployee || '0'}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Net Take Home (Approx)"
                                value={formData.netAmount || ''}
                                variant="filled"
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Gratuity (4.81%)"
                                value={formData.gratuity || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Monthly Gross Salary
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        ₹ {formData.grossSalary.toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Monthly CTC (Gross + EMR)
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        ₹ {formData.monthlyCTC.toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Yearly CTC
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        ₹ {formData.yearlyCTC.toLocaleString('en-IN')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                );

            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                This section captures the candidate's acceptance of the offer letter.
                            </Alert>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Candidate Name (Acceptance)"
                                value={formData.acceptanceCandidateName}
                                onChange={(e) => handleInputChange('acceptanceCandidateName', e.target.value)}
                                placeholder="Enter candidate's name for acceptance"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Aadhaar Number"
                                value={formData.aadhaarNumber}
                                onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                                placeholder="Enter 12-digit Aadhaar number"
                                inputProps={{ maxLength: 12 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                label="Acceptance Date"
                                value={formData.acceptanceDate}
                                onChange={(e) => handleInputChange('acceptanceDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f5f7ff' }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Authorised Signatory
                                    <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 'normal', px: 1, py: 0.25, bgcolor: 'primary.main', color: 'white', borderRadius: 4 }}>Fixed</Box>
                                </Typography>
                                <img
                                    src={`${IMAGE_BASE_URL}/uploads/assets/authorised_signatory.png`}
                                    alt="Authorised Signatory"
                                    style={{ maxWidth: '150px', maxHeight: '60px', display: 'block', marginTop: '8px' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Cogent Logistics Pvt Ltd
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Candidate Signature
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Upload the candidate's signature image (PNG, JPG, or JPEG)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleSignatureUpload}
                                    style={{ display: 'none' }}
                                    id="signature-upload"
                                />
                                <label htmlFor="signature-upload">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<UploadIcon />}
                                    >
                                        Upload Signature
                                    </Button>
                                </label>
                                {formData.candidateSignature && (
                                    <IconButton
                                        color="error"
                                        onClick={handleClearSignature}
                                        size="small"
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                )}
                            </Box>
                            {formData.candidateSignature && (
                                <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                                    <Typography variant="caption" color="text.secondary" gutterBottom>
                                        Signature Preview:
                                    </Typography>
                                    <img
                                        src={formData.candidateSignature}
                                        alt="Candidate Signature"
                                        style={{ maxWidth: '200px', maxHeight: '100px', display: 'block', marginTop: '8px' }}
                                    />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                );

            default:
                return null;
        }
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Offer Letter Generation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate professional offer letters with automated PDF generation
            </Typography>

            <Paper elevation={2} sx={{ p: 3 }}>
                {/* Header Image Preview */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', borderBottom: '1px solid #eee', pb: 2 }}>
                    <img
                        src={`${IMAGE_BASE_URL}/uploads/assets/offer_header.png`}
                        alt="Offer Letter Header"
                        style={{ maxWidth: '100%', height: 'auto', maxHeight: '120px' }}
                        onError={(e) => {
                            // Hide if image doesn't exist
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </Box>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ minHeight: '400px' }}>
                    {renderStepContent(activeStep)}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                        disabled={activeStep === 0 || !!generatedId}
                        onClick={handleBack}
                        startIcon={<BackIcon />}
                        variant="outlined"
                    >
                        Back
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {activeStep === steps.length - 1 ? (
                            <>
                                {generatedId ? (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleSendToEmployee}
                                        disabled={loading}
                                        startIcon={<SendIcon />}
                                        sx={{
                                            background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #388e3c 0%, #1b5e20 100%)',
                                            },
                                        }}
                                    >
                                        {loading ? 'Sending...' : 'Send to Employee Dashboard'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleGeneratePDF}
                                        disabled={loading}
                                        startIcon={<DownloadIcon />}
                                        size="large"
                                        sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                                            },
                                        }}
                                    >
                                        {loading ? 'Generating PDF...' : 'Generate & Download PDF'}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                endIcon={<NextIcon />}
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>
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
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default OfferLetterForm;
