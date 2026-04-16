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
  Rating,
  LinearProgress,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface KPI {
  id?: number;
  name: string;
  description: string;
  category: 'TECHNICAL' | 'BEHAVIORAL' | 'BUSINESS' | 'LEADERSHIP';
  weightage: number;
  targetValue: number;
  actualValue: number;
  unit: string;
  measurementMethod: string;
}

interface Goal {
  id?: number;
  title: string;
  description: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  targetDate: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  progress: number;
  kpis: number[];
}

interface AppraisalCycle {
  id?: number;
  employeeId: number;
  employeeName?: string;
  reviewPeriod: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SELF_ASSESSMENT' | 'MANAGER_REVIEW' | 'HR_REVIEW' | 'COMPLETED';
  currentStep: number;
  goals: Goal[];
  kpis: KPI[];
  overallRating: number;
  managerComments?: string;
  employeeComments?: string;
  departmentHeadComments?: string;
  hrComments?: string;
  ceoComments?: string;
  developmentPlan?: string;
}

const kpiCategories = [
  { value: 'TECHNICAL', label: 'Technical Skills' },
  { value: 'BEHAVIORAL', label: 'Behavioral Competencies' },
  { value: 'BUSINESS', label: 'Business Results' },
  { value: 'LEADERSHIP', label: 'Leadership Skills' },
];

const goalCategories = [
  'Performance Improvement',
  'Skill Development',
  'Project Delivery',
  'Team Collaboration',
  'Innovation',
  'Customer Satisfaction',
  'Process Improvement',
  'Leadership Development',
];

const AppraisalManagementForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  
  // Get user role and determine max accessible step
  const userRole = user?.role || 'employee';
  const maxStepForRole = userRole === 'employee' ? 2 : userRole === 'hr' ? 2 : 7; // employee: Self Assessment (2), hr: Self Assessment (2), admin: all (7)
  
  // Filter steps based on role - HR should not see HR Review step
  const allSteps = [
    'Goal Setting',
    'KPI Definition',
    'Self Assessment',
    'HR Review',
    'Manager Review',
    'Department Head Review',
    'CEO Approval',
    'Final Rating'
  ];
  // For HR, exclude HR Review step from the visible steps
  const steps = userRole === 'hr' 
    ? allSteps.filter((step) => step !== 'HR Review').slice(0, maxStepForRole + 1)
    : allSteps.slice(0, maxStepForRole + 1);

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [kpiDialog, setKpiDialog] = useState(false);
  const [goalDialog, setGoalDialog] = useState(false);
  const [showTips, setShowTips] = useState<{ [key: number]: boolean }>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [appraisal, setAppraisal] = useState<AppraisalCycle>({
    employeeId: 0,
    reviewPeriod: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT',
    currentStep: 0,
    goals: [],
    kpis: [],
    overallRating: 0,
  });

  const [newKPI, setNewKPI] = useState<KPI>({
    name: '',
    description: '',
    category: 'TECHNICAL',
    weightage: 0,
    targetValue: 0,
    actualValue: 0,
    unit: '',
    measurementMethod: '',
  });

  const [newGoal, setNewGoal] = useState<Goal>({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    targetDate: '',
    status: 'NOT_STARTED',
    progress: 0,
    kpis: [],
  });

  const loadAppraisal = async (appraisalId: number) => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getAppraisal(appraisalId);
      // Mock data
      const mockAppraisal: AppraisalCycle = {
        id: appraisalId,
        employeeId: 1,
        employeeName: 'John Doe',
        reviewPeriod: '2024 Annual Review',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'MANAGER_REVIEW',
        currentStep: 3,
        goals: [
          {
            id: 1,
            title: 'Complete React Certification',
            description: 'Obtain React Developer Certification to enhance frontend skills',
            category: 'Skill Development',
            priority: 'HIGH',
            targetDate: '2024-06-30',
            status: 'COMPLETED',
            progress: 100,
            kpis: [1, 2],
          },
          {
            id: 2,
            title: 'Lead Project Alpha',
            description: 'Successfully deliver Project Alpha on time and within budget',
            category: 'Project Delivery',
            priority: 'HIGH',
            targetDate: '2024-09-30',
            status: 'IN_PROGRESS',
            progress: 75,
            kpis: [3],
          },
        ],
        kpis: [
          {
            id: 1,
            name: 'Code Quality Score',
            description: 'Maintain high code quality standards',
            category: 'TECHNICAL',
            weightage: 20,
            targetValue: 90,
            actualValue: 88,
            unit: '%',
            measurementMethod: 'Code review scores',
          },
          {
            id: 2,
            name: 'Technical Certifications',
            description: 'Complete relevant technical certifications',
            category: 'TECHNICAL',
            weightage: 15,
            targetValue: 2,
            actualValue: 1,
            unit: 'certifications',
            measurementMethod: 'Completed certifications',
          },
          {
            id: 3,
            name: 'Project Delivery',
            description: 'On-time project delivery rate',
            category: 'BUSINESS',
            weightage: 25,
            targetValue: 95,
            actualValue: 92,
            unit: '%',
            measurementMethod: 'Project completion tracking',
          },
        ],
        overallRating: 4.2,
        managerComments: 'Excellent performance with strong technical skills and leadership potential.',
        employeeComments: 'Focused on continuous learning and taking on challenging projects.',
      };
      setAppraisal(mockAppraisal);
      // Ensure loaded step doesn't exceed max allowed step for user role
      const loadedStep = Math.min(mockAppraisal.currentStep, maxStepForRole);
      setActiveStep(loadedStep);
    } catch (error) {
      console.error('Error loading appraisal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      loadAppraisal(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  const addKPI = () => {
    if (!newKPI.name || !newKPI.description || newKPI.weightage <= 0) {
      setSnackbar({ open: true, message: 'Please fill all required KPI fields', severity: 'error' });
      return;
    }

    setAppraisal(prev => ({
      ...prev,
      kpis: [...prev.kpis, { ...newKPI, id: Date.now() }]
    }));

    setNewKPI({
      name: '',
      description: '',
      category: 'TECHNICAL',
      weightage: 0,
      targetValue: 0,
      actualValue: 0,
      unit: '',
      measurementMethod: '',
    });
    setKpiDialog(false);
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.description || !newGoal.targetDate) {
      setSnackbar({ open: true, message: 'Please fill all required goal fields', severity: 'error' });
      return;
    }

    setAppraisal(prev => ({
      ...prev,
      goals: [...prev.goals, { ...newGoal, id: Date.now() }]
    }));

    setNewGoal({
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      targetDate: '',
      status: 'NOT_STARTED',
      progress: 0,
      kpis: [],
    });
    setGoalDialog(false);
  };

  const calculateOverallScore = () => {
    if (appraisal.kpis.length === 0) return 0;
    
    const totalWeightage = appraisal.kpis.reduce((sum, kpi) => sum + kpi.weightage, 0);
    const weightedScore = appraisal.kpis.reduce((sum, kpi) => {
      const achievement = Math.min((kpi.actualValue / kpi.targetValue) * 100, 100);
      return sum + (achievement * kpi.weightage / 100);
    }, 0);
    
    return totalWeightage > 0 ? (weightedScore / totalWeightage) * 5 : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'DELAYED': return 'error';
      case 'NOT_STARTED': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1 && activeStep < maxStepForRole) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };
  
  // Ensure activeStep doesn't exceed max allowed step
  useEffect(() => {
    if (activeStep > maxStepForRole) {
      setActiveStep(maxStepForRole);
    }
  }, [activeStep, maxStepForRole]);

  const handleStepComplete = () => {
    // Validate current step before moving forward
    if (activeStep === 0 && appraisal.goals.length === 0) {
      setSnackbar({ open: true, message: 'Please add at least one goal', severity: 'error' });
      return;
    }
    if (activeStep === 1 && appraisal.kpis.length === 0) {
      setSnackbar({ open: true, message: 'Please add at least one KPI', severity: 'error' });
      return;
    }
    handleNext();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.saveAppraisal(appraisal);
      setSnackbar({ open: true, message: 'Appraisal saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error saving appraisal:', error);
      setSnackbar({ open: true, message: 'Error saving appraisal', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Appraisal Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive performance appraisal with KPI tracking and goal management.
      </Typography>
      {/* Appraisal Progress */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          Appraisal Progress
        </Typography>
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mt: 2 }}>
          {steps.map((label, index) => {
            const isAccessible = index <= maxStepForRole;
            return (
              <Step key={label} completed={index < activeStep} disabled={!isAccessible}>
                <StepLabel 
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: 'primary.main' },
                      '&.Mui-completed': { color: 'success.main' },
                      '&.Mui-disabled': { color: 'grey.400' }
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Step {activeStep + 1} of {steps.length} {userRole === 'employee' ? '(Employee Access)' : userRole === 'hr' ? '(HR Access)' : ''}
          </Typography>
          <Chip 
            label={appraisal.status.replace('_', ' ')} 
            color={appraisal.status === 'COMPLETED' ? 'success' : 'primary'} 
            size="small" 
          />
        </Box>
      </Paper>

      {/* Step-by-Step Content */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        {/* Step 0: Goal Setting */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon />
              Step 1: Goal Setting
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Define your performance goals and objectives for this appraisal period.
            </Alert>
            <Accordion 
              expanded={showTips[0] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 0: !prev[0] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Tips for Goal Setting
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Goals should be Specific, Measurable, Achievable, Relevant, and Time-bound (SMART). 
                  Consider both short-term objectives and long-term career development goals. Each goal should align with your role 
                  and contribute to organizational success. Set realistic target dates and prioritize goals based on their impact.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon />
            Goals & Objectives
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setGoalDialog(true);
              setShowTips(prev => ({ ...prev, 0: true })); // Auto-show tips when adding goal
            }}
          >
            Add Goal
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Goal</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Target Date</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appraisal.goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {goal.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {goal.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{goal.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={goal.priority}
                      color={getPriorityColor(goal.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(goal.targetDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={goal.progress}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption">{goal.progress}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={goal.status.replace('_', ' ')}
                      color={getStatusColor(goal.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" startIcon={<EditIcon />}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

            {appraisal.goals.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No goals defined yet. Add goals to track performance objectives.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Step 1: KPI Definition */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <StarIcon />
              Step 2: KPI Definition
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Define Key Performance Indicators to measure your performance against goals.
            </Alert>
            <Accordion 
              expanded={showTips[1] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 1: !prev[1] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Tips for KPI Definition
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> KPIs should directly measure progress toward your goals. Ensure weightage percentages 
                  add up to 100% across all KPIs. Use clear measurement methods and units (e.g., percentage, count, hours). 
                  Set challenging but achievable target values. Link KPIs to specific goals for better tracking and alignment.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon />
                Key Performance Indicators
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setKpiDialog(true);
                  setShowTips(prev => ({ ...prev, 1: true })); // Auto-show tips when adding KPI
                }}
              >
                Add KPI
              </Button>
            </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>KPI Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Actual</TableCell>
                <TableCell>Achievement</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appraisal.kpis.map((kpi) => {
                const achievement = Math.min((kpi.actualValue / kpi.targetValue) * 100, 100);
                const score = (achievement / 100) * 5;
                return (
                  <TableRow key={kpi.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {kpi.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {kpi.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={kpi.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{kpi.weightage}%</TableCell>
                    <TableCell>{kpi.targetValue} {kpi.unit}</TableCell>
                    <TableCell>{kpi.actualValue} {kpi.unit}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(achievement, 100)}
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                          color={achievement >= 100 ? 'success' : achievement >= 80 ? 'info' : 'warning'}
                        />
                        <Typography variant="caption">{achievement.toFixed(1)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Rating value={score} readOnly precision={0.1} size="small" />
                    </TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {appraisal.kpis.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No KPIs defined yet. Add KPIs to measure performance metrics.
            </Typography>
          </Box>
        )}
          </Box>
        )}

        {/* Step 2: Self Assessment */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <AssessmentIcon />
              Step 3: Self Assessment
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Rate your performance for each KPI. Be honest and provide evidence for your self-assessment.
            </Alert>
            <Accordion 
              expanded={showTips[2] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 2: !prev[2] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Tips for Self Assessment
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Enter your actual achievements for each KPI. The system will automatically calculate 
                  your self-score based on target vs actual performance. Be objective and provide specific examples in your 
                  assessment notes. Consider both quantitative results and qualitative contributions. This self-assessment 
                  will be reviewed by your manager.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Name</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Actual</TableCell>
                    <TableCell>Self Score (1-5)</TableCell>
                    <TableCell>Self Assessment Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appraisal.kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{kpi.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{kpi.description}</Typography>
                      </TableCell>
                      <TableCell>{kpi.targetValue} {kpi.unit}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={kpi.actualValue}
                          onChange={(e) => {
                            const updated = appraisal.kpis.map(k => 
                              k.id === kpi.id ? { ...k, actualValue: parseFloat(e.target.value) || 0 } : k
                            );
                            setAppraisal(prev => ({ ...prev, kpis: updated }));
                          }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Rating
                          value={kpi.actualValue ? Math.min((kpi.actualValue / kpi.targetValue) * 5, 5) : 0}
                          readOnly
                          precision={0.1}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          multiline
                          rows={2}
                          placeholder="Your assessment..."
                          sx={{ width: 200 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Employee Self-Assessment Comments"
                multiline
                rows={4}
                value={appraisal.employeeComments || ''}
                onChange={(e) => setAppraisal(prev => ({ ...prev, employeeComments: e.target.value }))}
                placeholder="Provide overall self-assessment comments..."
              />
            </Box>
          </Box>
        )}

        {/* Step 3: HR Review - Only visible to admin, not HR */}
        {activeStep === 3 && userRole === 'admin' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <AssessmentIcon />
              Step 4: HR Review
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              HR review for compliance and policy alignment. Review employee's self-assessment and provide your evaluation.
            </Alert>
            <Accordion 
              expanded={showTips[3] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 3: !prev[3] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Tips for HR Review
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Ensure the appraisal process follows company policies and compliance requirements. 
                  Review ratings for fairness and consistency across the organization. Compare the employee's self-assessment with 
                  their actual performance. Provide constructive feedback for each KPI. Your ratings should be fair, objective, 
                  and based on documented evidence.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Name</TableCell>
                    <TableCell>Employee Self Score</TableCell>
                    <TableCell>HR Score (1-5)</TableCell>
                    <TableCell>HR Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appraisal.kpis.map((kpi) => {
                    const selfScore = kpi.actualValue ? Math.min((kpi.actualValue / kpi.targetValue) * 5, 5) : 0;
                    return (
                      <TableRow key={kpi.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{kpi.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Rating value={selfScore} readOnly precision={0.1} size="small" />
                        </TableCell>
                        <TableCell>
                          <Rating
                            value={0}
                            onChange={(event, newValue) => {
                              // Handle HR score update
                            }}
                            precision={0.5}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" multiline rows={2} placeholder="HR feedback..." sx={{ width: 200 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="HR Overall Comments"
                multiline
                rows={4}
                value={appraisal.hrComments || ''}
                onChange={(e) => setAppraisal(prev => ({ ...prev, hrComments: e.target.value }))}
                placeholder="Provide overall HR review comments..."
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="error">Return for Changes</Button>
              <Button variant="contained" color="success">{userRole === 'hr' ? 'Forward to Admin' : 'Approve & Forward'}</Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Manager Review - Admin can review after HR forwards */}
        {activeStep === 4 && (userRole === 'admin' || userRole === 'hr') && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <AssessmentIcon />
              Step 5: Manager Review
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Review employee's self-assessment and HR review. Provide your evaluation. You can approve or return for changes.
            </Alert>
            <Accordion 
              expanded={showTips[4] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 4: !prev[4] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Tips for Manager Review
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Compare the employee's self-assessment and HR review with their actual performance and achievements. 
                  Provide constructive feedback for each KPI. Your ratings should be fair, objective, and based on documented 
                  evidence. If significant discrepancies exist, return the appraisal for clarification. Your comments will help 
                  guide the employee's development.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Name</TableCell>
                    <TableCell>HR Score</TableCell>
                    <TableCell>Manager Score (1-5)</TableCell>
                    <TableCell>Manager Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appraisal.kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{kpi.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Rating value={0} readOnly precision={0.1} size="small" />
                      </TableCell>
                      <TableCell>
                        <Rating
                          value={0}
                          onChange={(event, newValue) => {
                            // Handle manager score update
                          }}
                          precision={0.5}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" multiline rows={2} placeholder="Manager feedback..." sx={{ width: 200 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Manager Overall Comments"
                multiline
                rows={4}
                value={appraisal.managerComments || ''}
                onChange={(e) => setAppraisal(prev => ({ ...prev, managerComments: e.target.value }))}
                placeholder="Provide overall manager review comments..."
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="error">Return for Changes</Button>
              <Button variant="contained" color="success">Approve & Forward</Button>
            </Box>
          </Box>
        )}

        {/* Step 5: Department Head Review - Admin can review after Manager Review */}
        {activeStep === 5 && userRole === 'admin' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <AssessmentIcon />
              Step 6: Department Head Review
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Review the appraisal from a departmental perspective. Consider how the employee's performance aligns with departmental goals and standards.
            </Alert>
            <Accordion 
              expanded={showTips[5] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 5: !prev[5] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Tips for Department Head Review
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Review the appraisal from a departmental perspective. Consider how the employee's 
                  performance aligns with departmental goals and standards. Provide strategic feedback that considers broader 
                  organizational context. Ensure consistency across department appraisals. Your approval moves the process 
                  to CEO for final approval.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Name</TableCell>
                    <TableCell>Manager Score</TableCell>
                    <TableCell>Dept Head Score (1-5)</TableCell>
                    <TableCell>Dept Head Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appraisal.kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{kpi.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Rating value={0} readOnly precision={0.1} size="small" />
                      </TableCell>
                      <TableCell>
                        <Rating value={0} onChange={() => {}} precision={0.5} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" multiline rows={2} placeholder="Dept head feedback..." sx={{ width: 200 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Department Head Comments"
                multiline
                rows={4}
                value={appraisal.departmentHeadComments || ''}
                onChange={(e) => setAppraisal(prev => ({ ...prev, departmentHeadComments: e.target.value }))}
                placeholder="Provide department head review comments..."
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="error">Return for Changes</Button>
              <Button variant="contained" color="success">Approve & Forward to CEO</Button>
            </Box>
          </Box>
        )}

        {/* Step 6: CEO Approval - Only for Admin/CEO */}
        {activeStep === 6 && userRole !== 'employee' && userRole !== 'manager' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <CheckCircleIcon />
              Step 7: CEO Approval
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Final approval from CEO. Review all assessments and provide final comments.
            </Alert>
            <Accordion 
              expanded={showTips[6] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 6: !prev[6] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Tips for CEO Approval
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Review the complete appraisal journey, including all previous assessments and feedback. 
                  Consider the employee's overall contribution to organizational success. Provide strategic insights and final 
                  guidance. Your approval completes the appraisal cycle. Final comments should reflect executive perspective 
                  on performance and future potential.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Box sx={{ mb: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Overall Performance Summary</Typography>
                  <Typography variant="h4" color="primary">{calculateOverallScore().toFixed(2)}</Typography>
                  <Rating value={calculateOverallScore()} readOnly precision={0.1} size="large" />
                </CardContent>
              </Card>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Name</TableCell>
                    <TableCell>HR Score</TableCell>
                    <TableCell>CEO Final Score (1-5)</TableCell>
                    <TableCell>CEO Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appraisal.kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{kpi.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Rating value={0} readOnly precision={0.1} size="small" />
                      </TableCell>
                      <TableCell>
                        <Rating value={0} onChange={() => {}} precision={0.5} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" multiline rows={2} placeholder="CEO feedback..." sx={{ width: 200 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="CEO Final Comments"
                multiline
                rows={4}
                value={appraisal.ceoComments || ''}
                onChange={(e) => setAppraisal(prev => ({ ...prev, ceoComments: e.target.value }))}
                placeholder="Provide CEO final approval comments..."
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="error">Return for Changes</Button>
              <Button variant="contained" color="success">Final Approve & Complete</Button>
            </Box>
          </Box>
        )}

        {/* Step 7: Final Rating - Admin can complete the appraisal */}
        {activeStep === 7 && userRole === 'admin' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <StarIcon />
              Step 8: Final Rating & Summary
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Appraisal completed! Review the final ratings and summary below.
            </Alert>
            <Accordion 
              expanded={showTips[7] || false} 
              onChange={() => setShowTips(prev => ({ ...prev, 7: !prev[7] }))}
              sx={{ mb: 3, bgcolor: 'grey.50' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Summary & Tips for Final Rating
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Summary:</strong> This final step provides a comprehensive view of the entire appraisal process. 
                  Review all ratings from different stages, compare assessments, and understand the complete feedback journey. 
                  The overall rating reflects weighted performance across all KPIs. Use this summary for performance discussions, 
                  career planning, and setting objectives for the next appraisal cycle.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Overall Rating</Typography>
                    <Typography variant="h3" color="primary">{calculateOverallScore().toFixed(2)}</Typography>
                    <Rating value={calculateOverallScore()} readOnly precision={0.1} size="large" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                    <Chip label="COMPLETED" color="success" sx={{ mt: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Completed on: {new Date().toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Name</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Manager</TableCell>
                    <TableCell>Dept Head</TableCell>
                    <TableCell>HR</TableCell>
                    <TableCell>CEO</TableCell>
                    <TableCell>Final Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appraisal.kpis.map((kpi) => {
                    const finalScore = calculateOverallScore();
                    return (
                      <TableRow key={kpi.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{kpi.name}</Typography>
                        </TableCell>
                        <TableCell>{kpi.weightage}%</TableCell>
                        <TableCell>
                          <Rating value={0} readOnly size="small" />
                        </TableCell>
                        <TableCell>
                          <Rating value={0} readOnly size="small" />
                        </TableCell>
                        <TableCell>
                          <Rating value={0} readOnly size="small" />
                        </TableCell>
                        <TableCell>
                          <Rating value={0} readOnly size="small" />
                        </TableCell>
                        <TableCell>
                          <Rating value={0} readOnly size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{finalScore.toFixed(2)}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>All Comments Summary</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" paragraph>
                <strong>Employee:</strong> {appraisal.employeeComments || 'No comments'}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Manager:</strong> {appraisal.managerComments || 'No comments'}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Department Head:</strong> {appraisal.departmentHeadComments || 'No comments'}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>HR:</strong> {appraisal.hrComments || 'No comments'}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>CEO:</strong> {appraisal.ceoComments || 'No comments'}
              </Typography>
              {appraisal.developmentPlan && (
                <Typography variant="body2">
                  <strong>Development Plan:</strong> {appraisal.developmentPlan}
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Navigation Buttons */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/performance')}
            >
              Cancel
            </Button>
            {activeStep < steps.length - 1 && activeStep < maxStepForRole ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleStepComplete}
              >
                {activeStep === 0 || activeStep === 1 ? 'Next' : 'Complete Step & Next'}
              </Button>
            ) : activeStep === maxStepForRole ? (
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {userRole === 'employee' ? 'Submit for Review' : userRole === 'hr' ? 'Forward to Admin' : activeStep === 7 ? 'Complete Appraisal' : 'Approve & Forward'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : userRole === 'hr' && activeStep === 3 ? 'Forward to Admin' : activeStep === 7 ? 'Complete Appraisal' : 'Approve & Forward'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      {/* Add Goal Dialog */}
      <Dialog open={goalDialog} onClose={() => setGoalDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Goal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid
              size={{
                xs: 12,
                md: 8
              }}>
              <TextField
                fullWidth
                label="Goal Title"
                required
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newGoal.priority}
                  label="Priority"
                  onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as any }))}
                  sx={{
                    '& .MuiSelect-select': {
                      paddingLeft: '20px !important',
                      paddingRight: '40px !important',
                      paddingTop: '14px !important',
                      paddingBottom: '14px !important',
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      '@media (max-width:600px)': {
                        paddingLeft: '16px !important',
                        paddingRight: '32px !important',
                        paddingTop: '10px !important',
                        paddingBottom: '10px !important',
                      },
                    },
                  }}
                >
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                required
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newGoal.category}
                  label="Category"
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  sx={{
                    '& .MuiSelect-select': {
                      paddingLeft: '20px !important',
                      paddingRight: '40px !important',
                      paddingTop: '14px !important',
                      paddingBottom: '14px !important',
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      '@media (max-width:600px)': {
                        paddingLeft: '16px !important',
                        paddingRight: '32px !important',
                        paddingTop: '10px !important',
                        paddingBottom: '10px !important',
                      },
                    },
                  }}
                >
                  {goalCategories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
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
                label="Target Date"
                type="date"
                required
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addGoal}>Add Goal</Button>
        </DialogActions>
      </Dialog>
      {/* Add KPI Dialog */}
      <Dialog open={kpiDialog} onClose={() => setKpiDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New KPI</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid
              size={{
                xs: 12,
                md: 8
              }}>
              <TextField
                fullWidth
                label="KPI Name"
                required
                value={newKPI.name}
                onChange={(e) => setNewKPI(prev => ({ ...prev, name: e.target.value }))}
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
                  value={newKPI.category}
                  label="Category"
                  onChange={(e) => setNewKPI(prev => ({ ...prev, category: e.target.value as any }))}
                  sx={{
                    '& .MuiSelect-select': {
                      paddingLeft: '20px !important',
                      paddingRight: '40px !important',
                      paddingTop: '14px !important',
                      paddingBottom: '14px !important',
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      '@media (max-width:600px)': {
                        paddingLeft: '16px !important',
                        paddingRight: '32px !important',
                        paddingTop: '10px !important',
                        paddingBottom: '10px !important',
                      },
                    },
                  }}
                >
                  {kpiCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>{category.label}</MenuItem>
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
                value={newKPI.description}
                onChange={(e) => setNewKPI(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Weightage (%)"
                type="number"
                required
                value={newKPI.weightage}
                onChange={(e) => setNewKPI(prev => ({ ...prev, weightage: parseFloat(e.target.value) || 0 }))}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Target Value"
                type="number"
                required
                value={newKPI.targetValue}
                onChange={(e) => setNewKPI(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Actual Value"
                type="number"
                value={newKPI.actualValue}
                onChange={(e) => setNewKPI(prev => ({ ...prev, actualValue: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Unit"
                value={newKPI.unit}
                onChange={(e) => setNewKPI(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., %, count, hours"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Measurement Method"
                value={newKPI.measurementMethod}
                onChange={(e) => setNewKPI(prev => ({ ...prev, measurementMethod: e.target.value }))}
                placeholder="How will this KPI be measured?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKpiDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addKPI}>Add KPI</Button>
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

export default AppraisalManagementForm;
