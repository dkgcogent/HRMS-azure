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
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  LocalHospital as MedicalIcon,
  Security as InsuranceIcon,
  AccountBalance as GratuityIcon,
  Receipt as ClaimIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

interface InsurancePolicy {
  id?: number;
  employeeId: number;
  policyType: 'MEDICAL' | 'LIFE' | 'ACCIDENT' | 'DISABILITY';
  policyNumber: string;
  insuranceProvider: string;
  policyName: string;
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  beneficiaries: Beneficiary[];
  familyCoverage: FamilyCoverage[];
  isCompanyProvided: boolean;
  employeeContribution: number;
  companyContribution: number;
  deductible?: number;
  coPayment?: number;
  remarks?: string;
}

interface Beneficiary {
  id?: number;
  name: string;
  relationship: string;
  percentage: number;
  contactNumber?: string;
  address?: string;
}

interface FamilyCoverage {
  id?: number;
  memberName: string;
  relationship: string;
  dateOfBirth: string;
  coverageAmount: number;
  isActive: boolean;
}

interface InsuranceClaim {
  id?: number;
  policyId: number;
  claimNumber: string;
  claimDate: string;
  claimAmount: number;
  approvedAmount?: number;
  claimType: string;
  description: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';
  submittedDate: string;
  settlementDate?: string;
  remarks?: string;
  documents: string[];
}

interface GratuityRecord {
  employeeId: number;
  employeeName: string;
  joiningDate: string;
  currentSalary: number;
  serviceYears: number;
  eligibleAmount: number;
  calculationMethod: string;
  lastCalculationDate: string;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PAID';
  paymentDate?: string;
  actualAmount?: number;
}

const insuranceTypes = [
  { value: 'MEDICAL', label: 'Medical Insurance', icon: <MedicalIcon /> },
  { value: 'LIFE', label: 'Life Insurance', icon: <InsuranceIcon /> },
  { value: 'ACCIDENT', label: 'Accident Insurance', icon: <InsuranceIcon /> },
  { value: 'DISABILITY', label: 'Disability Insurance', icon: <InsuranceIcon /> },
];

const relationshipTypes = [
  'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'
];

const InsuranceBenefitsForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insurance');
  const [policyDialog, setPolicyDialog] = useState(false);
  const [claimDialog, setClaimDialog] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [gratuityRecords, setGratuityRecords] = useState<GratuityRecord[]>([]);

  const [newPolicy, setNewPolicy] = useState<InsurancePolicy>({
    employeeId: id ? parseInt(id) : 0,
    policyType: 'MEDICAL',
    policyNumber: '',
    insuranceProvider: '',
    policyName: '',
    coverageAmount: 0,
    premiumAmount: 0,
    premiumFrequency: 'ANNUALLY',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    beneficiaries: [],
    familyCoverage: [],
    isCompanyProvided: true,
    employeeContribution: 0,
    companyContribution: 0,
  });

  const [newClaim, setNewClaim] = useState<InsuranceClaim>({
    policyId: 0,
    claimNumber: '',
    claimDate: new Date().toISOString().split('T')[0],
    claimAmount: 0,
    claimType: '',
    description: '',
    status: 'SUBMITTED',
    submittedDate: new Date().toISOString().split('T')[0],
    documents: [],
  });

  const [newBeneficiary, setNewBeneficiary] = useState<Beneficiary>({
    name: '',
    relationship: '',
    percentage: 0,
  });


  useEffect(() => {
    loadInsurancePolicies();
    loadClaims();
    loadGratuityRecords();
    loadEmployees();
  }, []);

  const loadInsurancePolicies = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInsurancePolicies();
      if (response.success) {
        setInsurancePolicies(response.data || []);
      }
    } catch (error) {
      console.error('Error loading insurance policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    try {
      const response = await apiService.getInsuranceClaims();
      if (response.success) {
        setClaims(response.data || []);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  const loadGratuityRecords = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGratuityRecords();
      if (response.success) {
        setGratuityRecords(response.data || []);
      }
    } catch (error) {
      console.error('Error loading gratuity records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGratuity = async () => {
    try {
      setLoading(true);
      const response = await apiService.syncGratuityRecords();
      if (response.success) {
        setSnackbar({ open: true, message: response.message || 'Gratuity records synced successfully', severity: 'success' });
        loadGratuityRecords();
      } else {
        setSnackbar({ open: true, message: response.message || 'Error syncing gratuity records', severity: 'error' });
      }
    } catch (error) {
      console.error('Error syncing gratuity records:', error);
      setSnackbar({ open: true, message: 'Error syncing gratuity records', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees(1, 1000);
      if (response.success) {
        setEmployees(response.data.content || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handlePolicyChange = (field: keyof InsurancePolicy, value: any) => {
    setNewPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addBeneficiary = () => {
    if (!newBeneficiary.name || !newBeneficiary.relationship || newBeneficiary.percentage <= 0) {
      setSnackbar({ open: true, message: 'Please fill all beneficiary fields', severity: 'error' });
      return;
    }

    const totalPercentage = newPolicy.beneficiaries.reduce((sum, b) => sum + b.percentage, 0) + newBeneficiary.percentage;
    if (totalPercentage > 100) {
      setSnackbar({ open: true, message: 'Total beneficiary percentage cannot exceed 100%', severity: 'error' });
      return;
    }

    setNewPolicy(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, { ...newBeneficiary, id: Date.now() }]
    }));

    setNewBeneficiary({ name: '', relationship: '', percentage: 0 });
  };

  const submitPolicy = async () => {
    if (!newPolicy.employeeId || !newPolicy.policyNumber || !newPolicy.policyName) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createInsurancePolicy(newPolicy as any);
      if (response.success) {
        setSnackbar({ open: true, message: 'Insurance policy created successfully!', severity: 'success' });
        setPolicyDialog(false);
        loadInsurancePolicies();
      } else {
        setSnackbar({ open: true, message: response.message || 'Error creating policy', severity: 'error' });
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      setSnackbar({ open: true, message: 'Error creating policy', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async () => {
    // Generate claim number if empty
    const claimData = { ...newClaim };
    if (!claimData.claimNumber) {
      claimData.claimNumber = `CLM-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    if (!claimData.policyId || !claimData.claimAmount || !claimData.description || !claimData.claimType) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createInsuranceClaim(claimData as any);
      if (response.success) {
        setSnackbar({ open: true, message: 'Insurance claim submitted successfully!', severity: 'success' });
        setClaimDialog(false);
        // Reset new claim form
        setNewClaim({
          policyId: 0,
          claimNumber: '',
          claimDate: new Date().toISOString().split('T')[0],
          claimAmount: 0,
          claimType: '',
          description: '',
          status: 'SUBMITTED',
          submittedDate: new Date().toISOString().split('T')[0],
          documents: [],
        });
        loadClaims();
      } else {
        setSnackbar({ open: true, message: response.message || 'Error submitting claim', severity: 'error' });
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setSnackbar({ open: true, message: 'Error submitting claim', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': case 'ELIGIBLE': case 'SETTLED': case 'APPROVED': return 'success';
      case 'PENDING': case 'UNDER_REVIEW': case 'SUBMITTED': return 'warning';
      case 'EXPIRED': case 'CANCELLED': case 'REJECTED': return 'error';
      case 'NOT_ELIGIBLE': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Insurance & Benefits Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage employee insurance policies, claims, and benefits including gratuity.
      </Typography>
      {/* Tab Navigation */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0 }}>
            {[
              { id: 'insurance', label: 'Insurance Policies', icon: <InsuranceIcon /> },
              { id: 'claims', label: 'Claims', icon: <ClaimIcon /> },
              { id: 'gratuity', label: 'Gratuity', icon: <GratuityIcon /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'contained' : 'text'}
                startIcon={tab.icon}
                sx={{ borderRadius: 0, minWidth: 180 }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Insurance Policies Tab */}
          {activeTab === 'insurance' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Insurance Policies</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setPolicyDialog(true)}
                >
                  Add Policy
                </Button>
              </Box>

              <Grid container spacing={3}>
                {insurancePolicies.map((policy) => {
                  const employee = employees.find(e => e.id === policy.employeeId);
                  return (
                    <Grid
                      key={policy.id}
                      size={{
                        xs: 12,
                        md: 6,
                        lg: 4
                      }}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.light' }}>
                                {insuranceTypes.find(t => t.value === policy.policyType)?.icon}
                              </Avatar>
                              <Box>
                                <Typography variant="h6">{policy.policyName}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {policy.policyNumber}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={policy.status}
                              color={getStatusColor(policy.status) as any}
                              size="small"
                            />
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          <Typography variant="body2"><strong>Employee:</strong> {employee?.firstName} {employee?.lastName}</Typography>
                          <Typography variant="body2"><strong>Provider:</strong> {policy.insuranceProvider}</Typography>
                          <Typography variant="body2"><strong>Coverage:</strong> ₹{policy.coverageAmount.toLocaleString()}</Typography>
                          <Typography variant="body2"><strong>Premium:</strong> ₹{policy.premiumAmount.toLocaleString()} ({policy.premiumFrequency})</Typography>
                          <Typography variant="body2"><strong>Valid Till:</strong> {new Date(policy.endDate).toLocaleDateString()}</Typography>

                          {policy.familyCoverage.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" fontWeight="bold">Family Coverage:</Typography>
                              {policy.familyCoverage.map((member) => (
                                <Typography key={member.id} variant="caption" display="block" color="text.secondary">
                                  {member.memberName} ({member.relationship}) - ₹{member.coverageAmount.toLocaleString()}
                                </Typography>
                              ))}
                            </Box>
                          )}

                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<EditIcon />}>
                              Edit
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<ClaimIcon />}>
                              Claim
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {insurancePolicies.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No insurance policies found.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Claims Tab */}
          {activeTab === 'claims' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Insurance Claims</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setClaimDialog(true)}
                >
                  Submit Claim
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Claim Number</TableCell>
                      <TableCell>Policy</TableCell>
                      <TableCell>Claim Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {claims.map((claim) => {
                      const policy = insurancePolicies.find(p => p.id === claim.policyId);
                      return (
                        <TableRow key={claim.id}>
                          <TableCell>{claim.claimNumber}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{policy?.policyName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {policy?.policyNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{claim.claimType}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">₹{claim.claimAmount.toLocaleString()}</Typography>
                              {claim.approvedAmount && (
                                <Typography variant="caption" color="success.main">
                                  Approved: ₹{claim.approvedAmount.toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={claim.status.replace('_', ' ')}
                              color={getStatusColor(claim.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{new Date(claim.submittedDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {claims.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No insurance claims found.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Gratuity Tab */}
          {activeTab === 'gratuity' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Gratuity Records</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<GratuityIcon />}
                  onClick={handleSyncGratuity}
                  disabled={loading}
                >
                  {loading ? 'Syncing...' : 'Sync Gratuity Records'}
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Service Period</TableCell>
                      <TableCell>Current Salary</TableCell>
                      <TableCell>Service Years</TableCell>
                      <TableCell>Eligible Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gratuityRecords.map((record) => (
                      <TableRow key={record.employeeId}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar>{record.employeeName.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {record.employeeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {record.employeeId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(record.joiningDate).toLocaleDateString()} - Present
                          </Typography>
                        </TableCell>
                        <TableCell>₹{record.currentSalary.toLocaleString()}</TableCell>
                        <TableCell>{record.serviceYears} years</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ₹{record.eligibleAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last calculated: {new Date(record.lastCalculationDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.status.replace('_', ' ')}
                            color={getStatusColor(record.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSnackbar({
                                open: true,
                                message: `Detailed calculation for ${record.employeeName}: (${record.currentSalary}/26) * 15 * ${record.serviceYears} = ₹${record.eligibleAmount.toLocaleString()}`,
                                severity: 'info'
                              });
                            }}
                          >
                            Recalculate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gratuity Calculation Formula
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Formula:</strong> (15 days salary × years of service) ÷ 26 working days per month
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Eligibility:</strong> Minimum 5 years of continuous service required
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Maximum:</strong> ₹20,00,000 as per Payment of Gratuity Act
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Paper>
      {/* Add Policy Dialog */}
      <Dialog open={policyDialog} onClose={() => setPolicyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Insurance Policy</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={newPolicy.employeeId}
                  label="Employee"
                  onChange={(e) => handlePolicyChange('employeeId', e.target.value)}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId || 'No ID'}) - {employee.designationName || 'No Designation'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>Policy Type</InputLabel>
                <Select
                  value={newPolicy.policyType}
                  label="Policy Type"
                  onChange={(e) => handlePolicyChange('policyType', e.target.value)}
                >
                  {insuranceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
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
                label="Policy Number"
                required
                value={newPolicy.policyNumber}
                onChange={(e) => handlePolicyChange('policyNumber', e.target.value)}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Insurance Provider"
                required
                value={newPolicy.insuranceProvider}
                onChange={(e) => handlePolicyChange('insuranceProvider', e.target.value)}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Policy Name"
                required
                value={newPolicy.policyName}
                onChange={(e) => handlePolicyChange('policyName', e.target.value)}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Coverage Amount"
                type="number"
                required
                value={newPolicy.coverageAmount}
                onChange={(e) => handlePolicyChange('coverageAmount', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Premium Amount"
                type="number"
                required
                value={newPolicy.premiumAmount}
                onChange={(e) => handlePolicyChange('premiumAmount', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth>
                <InputLabel>Premium Frequency</InputLabel>
                <Select
                  value={newPolicy.premiumFrequency}
                  label="Premium Frequency"
                  onChange={(e) => handlePolicyChange('premiumFrequency', e.target.value)}
                >
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="ANNUALLY">Annually</MenuItem>
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
                label="Start Date"
                type="date"
                required
                value={newPolicy.startDate}
                onChange={(e) => handlePolicyChange('startDate', e.target.value)}
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
                label="End Date"
                type="date"
                required
                value={newPolicy.endDate}
                onChange={(e) => handlePolicyChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newPolicy.isCompanyProvided}
                    onChange={(e) => handlePolicyChange('isCompanyProvided', e.target.checked)}
                  />
                }
                label="Company Provided Policy"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Employee Contribution"
                type="number"
                value={newPolicy.employeeContribution}
                onChange={(e) => handlePolicyChange('employeeContribution', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Company Contribution"
                type="number"
                value={newPolicy.companyContribution}
                onChange={(e) => handlePolicyChange('companyContribution', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            {/* Beneficiaries Section */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Beneficiaries
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <TextField
                    fullWidth
                    label="Beneficiary Name"
                    value={newBeneficiary.name}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 3
                  }}>
                  <FormControl fullWidth>
                    <InputLabel>Relationship</InputLabel>
                    <Select
                      value={newBeneficiary.relationship}
                      label="Relationship"
                      onChange={(e) => setNewBeneficiary(prev => ({ ...prev, relationship: e.target.value }))}
                    >
                      {relationshipTypes.map((rel) => (
                        <MenuItem key={rel} value={rel}>{rel}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 3
                  }}>
                  <TextField
                    fullWidth
                    label="Percentage"
                    type="number"
                    value={newBeneficiary.percentage}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                    InputProps={{ endAdornment: '%' }}
                  />
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    md: 2
                  }}>
                  <Button variant="outlined" onClick={addBeneficiary} fullWidth>
                    Add
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                {newPolicy.beneficiaries.map((beneficiary, index) => (
                  <Chip
                    key={index}
                    label={`${beneficiary.name} (${beneficiary.relationship}) - ${beneficiary.percentage}%`}
                    onDelete={() => {
                      setNewPolicy(prev => ({
                        ...prev,
                        beneficiaries: prev.beneficiaries.filter((_, i) => i !== index)
                      }));
                    }}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitPolicy} disabled={loading}>
            {loading ? 'Creating...' : 'Create Policy'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Submit Claim Dialog */}
      <Dialog open={claimDialog} onClose={() => setClaimDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Insurance Claim</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Claim Number"
                value={newClaim.claimNumber}
                onChange={(e) => setNewClaim(prev => ({ ...prev, claimNumber: e.target.value }))}
                placeholder="Leave blank to auto-generate"
                helperText="System will generate a number if left blank"
              />
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Insurance Policy</InputLabel>
                <Select
                  value={newClaim.policyId}
                  label="Insurance Policy"
                  onChange={(e) => setNewClaim(prev => ({ ...prev, policyId: e.target.value as number }))}
                >
                  {insurancePolicies.map((policy) => (
                    <MenuItem key={policy.id} value={policy.id}>
                      {policy.policyName} ({policy.policyNumber})
                    </MenuItem>
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
                label="Claim Date"
                type="date"
                required
                value={newClaim.claimDate}
                onChange={(e) => setNewClaim(prev => ({ ...prev, claimDate: e.target.value }))}
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
                label="Claim Amount"
                type="number"
                required
                value={newClaim.claimAmount}
                onChange={(e) => setNewClaim(prev => ({ ...prev, claimAmount: parseFloat(e.target.value) || 0 }))}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Claim Type"
                required
                value={newClaim.claimType}
                onChange={(e) => setNewClaim(prev => ({ ...prev, claimType: e.target.value }))}
                placeholder="e.g., Hospitalization, Outpatient, Emergency"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                required
                value={newClaim.description}
                onChange={(e) => setNewClaim(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the medical condition or treatment..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitClaim} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Claim'}
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

export default InsuranceBenefitsForm;
