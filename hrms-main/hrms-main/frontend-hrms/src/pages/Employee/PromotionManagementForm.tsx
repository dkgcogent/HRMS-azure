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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  TrendingUp as PromotionIcon,
  WorkHistory as CareerIcon,
  Star as AchievementIcon,
  Timeline as TimelineIcon,
  Approval as ApprovalIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, Promotion } from '../../services/api';

interface PromotionRecord {
  id?: number;
  employeeId: number;
  employeeName?: string;
  fromDesignation: string;
  toDesignation: string;
  fromDepartment: string;
  toDepartment: string;
  fromSalary: number;
  toSalary: number;
  promotionDate: string;
  effectiveDate: string;
  promotionType: 'PROMOTION' | 'TRANSFER' | 'DESIGNATION_CHANGE' | 'SALARY_REVISION';
  reason: string;
  approvedBy: string;
  approvalDate: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IMPLEMENTED' | 'REJECTED';
  justification: string;
  performanceRating?: number;
  achievements?: string[];
  newResponsibilities?: string;
  trainingRequired?: string;
  remarks?: string;
}

interface CareerProgression {
  employeeId: number;
  employeeName: string;
  joiningDate: string;
  currentDesignation: string;
  currentDepartment: string;
  currentSalary: number;
  totalExperience: number;
  promotions: PromotionRecord[];
  careerPath: {
    designation: string;
    department: string;
    startDate: string;
    endDate?: string;
    duration: string;
    salary: number;
  }[];
}

const promotionTypes = [
  { value: 'PROMOTION', label: 'Promotion', color: 'success' },
  { value: 'TRANSFER', label: 'Transfer', color: 'info' },
  { value: 'DESIGNATION_CHANGE', label: 'Designation Change', color: 'warning' },
  { value: 'SALARY_REVISION', label: 'Salary Revision', color: 'primary' },
];

const promotionStatuses = [
  { value: 'DRAFT', label: 'Draft', color: 'default' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'warning' },
  { value: 'APPROVED', label: 'Approved', color: 'success' },
  { value: 'IMPLEMENTED', label: 'Implemented', color: 'info' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
];

const PromotionManagementForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('promotions');
  const [promotionDialog, setPromotionDialog] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<CareerProgression | null>(null);
  const [newPromotion, setNewPromotion] = useState<PromotionRecord>({
    employeeId: 0,
    fromDesignation: '',
    toDesignation: '',
    fromDepartment: '',
    toDepartment: '',
    fromSalary: 0,
    toSalary: 0,
    promotionDate: new Date().toISOString().split('T')[0],
    effectiveDate: '',
    promotionType: 'PROMOTION',
    reason: '',
    approvedBy: '',
    approvalDate: '',
    status: 'DRAFT',
    justification: '',
    achievements: [],
  });

  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    loadPromotions();
    loadMasterData();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPromotions();
      if (response.success) {
        setPromotions(response.data || []);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [empRes, deptRes, desRes] = await Promise.all([
        apiService.getEmployees(1, 1000),
        apiService.getDepartments(),
        apiService.getDesignations()
      ]);

      if (empRes.success) setEmployees(empRes.data.content || []);
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (desRes.success) setDesignations(desRes.data || []);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start) return '';
    const startDate = new Date(start);
    const endDate = !end || end === 'Present' ? new Date() : new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} days`;
    const months = Math.floor(diffDays / 30.44);
    if (months < 12) return `${months} months`;
    const years = (diffDays / 365.25).toFixed(1);
    return `${years} years`;
  };

  const loadEmployeeCareerProgression = async (employeeId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getEmployeeCareerProgression(employeeId);
      if (response.success) {
        const employee = employees.find(e => e.id === employeeId);
        const promotionData = (response.data || []).sort((a: any, b: any) =>
          new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
        );

        const careerPath = [];
        if (employee) {
          if (promotionData.length > 0) {
            // Initial joining record
            careerPath.push({
              designation: promotionData[0].fromDesignation,
              department: promotionData[0].fromDepartment,
              startDate: new Date(employee.joiningDate).toLocaleDateString(),
              endDate: new Date(promotionData[0].effectiveDate).toLocaleDateString(),
              salary: promotionData[0].fromSalary,
              duration: calculateDuration(employee.joiningDate, promotionData[0].effectiveDate)
            });

            // Promotion milestones
            promotionData.forEach((p: any, idx: number) => {
              const nextP = promotionData[idx + 1];
              careerPath.push({
                designation: p.toDesignation,
                department: p.toDepartment,
                startDate: new Date(p.effectiveDate).toLocaleDateString(),
                endDate: nextP ? new Date(nextP.effectiveDate).toLocaleDateString() : 'Present',
                salary: p.toSalary,
                duration: calculateDuration(p.effectiveDate, nextP ? nextP.effectiveDate : '')
              });
            });
          } else {
            // No promotions yet - show joining info
            careerPath.push({
              designation: employee.designationName || employee.designation,
              department: employee.departmentName || employee.department,
              startDate: new Date(employee.joiningDate).toLocaleDateString(),
              endDate: 'Present',
              salary: employee.salary || 0,
              duration: calculateDuration(employee.joiningDate, '')
            });
          }
        }

        const progression: CareerProgression = {
          employeeId,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
          joiningDate: employee?.joiningDate || '',
          currentDesignation: employee?.designationName || '',
          currentDepartment: employee?.departmentName || '',
          currentSalary: employee?.salary || 0,
          totalExperience: employee?.joiningDate ? parseFloat((Math.abs(new Date().getTime() - new Date(employee.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)) : 0,
          promotions: response.data || [],
          careerPath: careerPath.reverse()
        };
        setSelectedEmployee(progression);
        setActiveTab('career-progression');
      }
    } catch (error) {
      console.error('Error loading career progression:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionChange = (field: keyof PromotionRecord, value: any) => {
    setNewPromotion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmployeeSelect = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setNewPromotion(prev => ({
        ...prev,
        employeeId,
        fromDesignation: employee.designationName || employee.designation || '',
        fromDepartment: employee.departmentName || employee.department || '',
        fromSalary: employee.salary || 0,
      }));
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim() && !newPromotion.achievements?.includes(newAchievement.trim())) {
      setNewPromotion(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (achievement: string) => {
    setNewPromotion(prev => ({
      ...prev,
      achievements: prev.achievements?.filter(a => a !== achievement) || []
    }));
  };

  const submitPromotion = async () => {
    if (!newPromotion.employeeId || !newPromotion.toDesignation || !newPromotion.justification) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createPromotion(newPromotion as any);
      if (response.success) {
        setSnackbar({ open: true, message: 'Promotion record created successfully!', severity: 'success' });
        setPromotionDialog(false);
        loadPromotions();
        setNewPromotion({
          employeeId: 0,
          fromDesignation: '',
          toDesignation: '',
          fromDepartment: '',
          toDepartment: '',
          fromSalary: 0,
          toSalary: 0,
          promotionDate: new Date().toISOString().split('T')[0],
          effectiveDate: '',
          promotionType: 'PROMOTION',
          reason: '',
          approvedBy: '',
          approvalDate: '',
          status: 'DRAFT',
          justification: '',
          achievements: [],
        });
      } else {
        setSnackbar({ open: true, message: response.message || 'Error creating promotion record', severity: 'error' });
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      setSnackbar({ open: true, message: 'Error creating promotion record', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = promotionStatuses.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  const getTypeColor = (type: string) => {
    const typeObj = promotionTypes.find(t => t.value === type);
    return typeObj?.color || 'default';
  };

  const calculateSalaryIncrease = (fromSalary: number, toSalary: number) => {
    if (fromSalary === 0) return 0;
    return ((toSalary - fromSalary) / fromSalary) * 100;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Promotion & Career Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage employee promotions, transfers, and career progression tracking.
      </Typography>
      {/* Tab Navigation */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0 }}>
            {[
              { id: 'promotions', label: 'Promotions', icon: <PromotionIcon /> },
              { id: 'career-progression', label: 'Career Progression', icon: <CareerIcon /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'contained' : 'text'}
                startIcon={tab.icon}
                sx={{ borderRadius: 0, minWidth: 200 }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Promotions Tab */}
          {activeTab === 'promotions' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Promotion Records</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setPromotionDialog(true)}
                >
                  Create Promotion
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Promotion Details</TableCell>
                      <TableCell>Salary Change</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Effective Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {promotions.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar>{promotion.employeeName?.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {promotion.employeeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {promotion.employeeId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              <strong>From:</strong> {promotion.fromDesignation}
                            </Typography>
                            <Typography variant="body2">
                              <strong>To:</strong> {promotion.toDesignation}
                            </Typography>
                            {promotion.fromDepartment !== promotion.toDepartment && (
                              <Typography variant="caption" color="text.secondary">
                                Dept: {promotion.fromDepartment} → {promotion.toDepartment}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              ₹{promotion.fromSalary.toLocaleString()} → ₹{promotion.toSalary.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              +{calculateSalaryIncrease(promotion.fromSalary, promotion.toSalary).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={promotionTypes.find(t => t.value === promotion.promotionType)?.label}
                            color={getTypeColor(promotion.promotionType) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={promotionStatuses.find(s => s.value === promotion.status)?.label}
                            color={getStatusColor(promotion.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(promotion.effectiveDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => loadEmployeeCareerProgression(promotion.employeeId)}
                          >
                            View Career
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {promotions.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No promotion records found.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Career Progression Tab */}
          {activeTab === 'career-progression' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Employee Career Progression</Typography>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Select Employee</InputLabel>
                  <Select
                    value={selectedEmployee?.employeeId || ''}
                    label="Select Employee"
                    onChange={(e) => loadEmployeeCareerProgression(e.target.value as number)}
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {selectedEmployee ? (
                <Grid container spacing={3}>
                  {/* Employee Summary */}
                  <Grid
                    size={{
                      xs: 12,
                      md: 4
                    }}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ width: 60, height: 60 }}>
                            {selectedEmployee.employeeName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{selectedEmployee.employeeName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedEmployee.currentDesignation}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2"><strong>Department:</strong> {selectedEmployee.currentDepartment}</Typography>
                        <Typography variant="body2"><strong>Current Salary:</strong> ₹{selectedEmployee.currentSalary.toLocaleString()}</Typography>
                        <Typography variant="body2"><strong>Joining Date:</strong> {new Date(selectedEmployee.joiningDate).toLocaleDateString()}</Typography>
                        <Typography variant="body2"><strong>Experience:</strong> {selectedEmployee.totalExperience} years</Typography>
                        <Typography variant="body2"><strong>Promotions:</strong> {selectedEmployee.promotions.length}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Career Timeline */}
                  <Grid
                    size={{
                      xs: 12,
                      md: 8
                    }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimelineIcon />
                          Career Timeline
                        </Typography>
                        <Timeline>
                          {selectedEmployee.careerPath.map((path, index) => (
                            <TimelineItem key={index}>
                              <TimelineOppositeContent color="text.secondary">
                                {path.startDate} - {path.endDate || 'Present'}
                                <br />
                                <Typography variant="caption">({path.duration})</Typography>
                              </TimelineOppositeContent>
                              <TimelineSeparator>
                                <TimelineDot color={index === 0 ? 'primary' : 'success'}>
                                  {index === 0 ? <CareerIcon /> : <PromotionIcon />}
                                </TimelineDot>
                                {index < selectedEmployee.careerPath.length - 1 && <TimelineConnector />}
                              </TimelineSeparator>
                              <TimelineContent>
                                <Typography variant="h6">{path.designation}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {path.department}
                                </Typography>
                                <Typography variant="body2">
                                  Salary: ₹{path.salary.toLocaleString()}
                                </Typography>
                              </TimelineContent>
                            </TimelineItem>
                          ))}
                        </Timeline>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Promotion History */}
                  <Grid size={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Promotion History
                        </Typography>
                        {selectedEmployee.promotions.length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>From</TableCell>
                                  <TableCell>To</TableCell>
                                  <TableCell>Salary Change</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Reason</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {selectedEmployee.promotions.map((promotion) => (
                                  <TableRow key={promotion.id}>
                                    <TableCell>{new Date(promotion.effectiveDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{promotion.fromDesignation}</TableCell>
                                    <TableCell>{promotion.toDesignation}</TableCell>
                                    <TableCell>
                                      ₹{promotion.fromSalary.toLocaleString()} → ₹{promotion.toSalary.toLocaleString()}
                                      <Typography variant="caption" color="success.main" display="block">
                                        +{calculateSalaryIncrease(promotion.fromSalary, promotion.toSalary).toFixed(1)}%
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={promotionTypes.find(t => t.value === promotion.promotionType)?.label}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>{promotion.reason}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No promotion history available.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Select an employee to view their career progression.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      {/* Create Promotion Dialog */}
      <Dialog open={promotionDialog} onClose={() => setPromotionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Promotion Record</DialogTitle>
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
                  value={newPromotion.employeeId}
                  label="Employee"
                  onChange={(e) => handleEmployeeSelect(e.target.value as number)}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} - {employee.designationName || employee.designation}
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
                <InputLabel>Promotion Type</InputLabel>
                <Select
                  value={newPromotion.promotionType}
                  label="Promotion Type"
                  onChange={(e) => handlePromotionChange('promotionType', e.target.value)}
                >
                  {promotionTypes.map((type) => (
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
                label="From Designation"
                value={newPromotion.fromDesignation}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>To Designation</InputLabel>
                <Select
                  value={newPromotion.toDesignation}
                  label="To Designation"
                  onChange={(e) => handlePromotionChange('toDesignation', e.target.value)}
                >
                  {designations.map((designation) => (
                    <MenuItem key={designation.id} value={designation.name}>
                      {designation.name}
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
                label="From Department"
                value={newPromotion.fromDepartment}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth>
                <InputLabel>To Department</InputLabel>
                <Select
                  value={newPromotion.toDepartment || newPromotion.fromDepartment}
                  label="To Department"
                  onChange={(e) => handlePromotionChange('toDepartment', e.target.value)}
                >
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.name}>
                      {department.name}
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
                label="From Salary"
                type="number"
                value={newPromotion.fromSalary}
                InputProps={{ readOnly: true, startAdornment: '₹' }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="To Salary"
                type="number"
                required
                value={newPromotion.toSalary}
                onChange={(e) => handlePromotionChange('toSalary', parseFloat(e.target.value) || 0)}
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
                label="Promotion Date"
                type="date"
                required
                value={newPromotion.promotionDate}
                onChange={(e) => handlePromotionChange('promotionDate', e.target.value)}
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
                label="Effective Date"
                type="date"
                required
                value={newPromotion.effectiveDate}
                onChange={(e) => handlePromotionChange('effectiveDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Reason for Promotion"
                required
                value={newPromotion.reason}
                onChange={(e) => handlePromotionChange('reason', e.target.value)}
                placeholder="Brief reason for this promotion..."
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Justification"
                multiline
                rows={3}
                required
                value={newPromotion.justification}
                onChange={(e) => handlePromotionChange('justification', e.target.value)}
                placeholder="Detailed justification for the promotion..."
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Key Achievements
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <TextField
                  label="Add Achievement"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                  sx={{ flexGrow: 1 }}
                />
                <Button variant="outlined" onClick={addAchievement}>Add</Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {newPromotion.achievements?.map((achievement, index) => (
                  <Chip
                    key={index}
                    label={achievement}
                    onDelete={() => removeAchievement(achievement)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="New Responsibilities"
                multiline
                rows={2}
                value={newPromotion.newResponsibilities || ''}
                onChange={(e) => handlePromotionChange('newResponsibilities', e.target.value)}
                placeholder="New roles and responsibilities..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Training Required"
                multiline
                rows={2}
                value={newPromotion.trainingRequired || ''}
                onChange={(e) => handlePromotionChange('trainingRequired', e.target.value)}
                placeholder="Any training requirements..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromotionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitPromotion} disabled={loading}>
            {loading ? 'Creating...' : 'Create Promotion'}
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

export default PromotionManagementForm;
