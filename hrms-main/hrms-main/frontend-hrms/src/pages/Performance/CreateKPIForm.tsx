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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Goal {
  id?: number;
  title: string;
  description: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  targetDate: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  progress: number;
}

interface KPIItem {
  id?: number;
  name: string;
  category: 'TECHNICAL' | 'BEHAVIORAL' | 'BUSINESS' | 'LEADERSHIP';
  description: string;
  weightage: number;
  targetValue: number;
  actualValue: number;
  unit: string;
  measurementMethod: string;
  employeeSelfScore?: number | null;
  selfAssessmentNotes?: string;
}

interface AppraisalCategory {
  id: number;
  name: string;
  description: string;
}

const CreateKPIForm: React.FC = () => {
  // Steps for KPI creation
  const steps = [
    'Period Selection',
    'Goal Setting',
    'KPI Definition',
    'Self Assessment'
  ];

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const userRole = user?.role || 'employee';
  const maxStepForRole = steps.length - 1;

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  });
  const [showTips, setShowTips] = useState<{ [key: number]: boolean }>({});

  const [formData, setFormData] = useState({
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    appraisalCategoryId: '',
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpiItems, setKpiItems] = useState<KPIItem[]>([]);
  const [categories, setCategories] = useState<AppraisalCategory[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<KPIItem>({
    name: '',
    category: 'TECHNICAL',
    description: '',
    weightage: 0,
    targetValue: 0,
    actualValue: 0,
    unit: '',
    measurementMethod: '',
  });
  const [currentGoal, setCurrentGoal] = useState<Goal>({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    targetDate: '',
    status: 'NOT_STARTED',
    progress: 0,
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [overallComments, setOverallComments] = useState('');

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

  const kpiCategories = [
    { value: 'TECHNICAL', label: 'Technical Skills' },
    { value: 'BEHAVIORAL', label: 'Behavioral Competencies' },
    { value: 'BUSINESS', label: 'Business Results' },
    { value: 'LEADERSHIP', label: 'Leadership Skills' },
  ];

  const loadCategories = React.useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setSnackbar({ open: true, message: 'Please login again', severity: 'error' });
          return;
        }
        throw new Error(`Failed to load categories: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
        if (result.data.length === 0) {
          setSnackbar({ open: true, message: 'No appraisal categories found. Please contact administrator.', severity: 'warning' });
        }
      } else {
        throw new Error(result.message || 'Failed to load categories');
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setSnackbar({ open: true, message: `Error loading categories: ${error.message || 'Unknown error'}`, severity: 'error' });
    }
  }, []);

  const loadKPI = React.useCallback(async (kpiId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/${kpiId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        const kpi = result.data;

        // Check if user can edit this KPI
        // Admin and HR can edit any KPI, employees can only edit their own
        const canEdit = userRole === 'admin' || userRole === 'hr' ||
          (kpi.employee_id && parseInt(localStorage.getItem('employeeId') || '0') === kpi.employee_id);

        if (!canEdit && userRole === 'employee') {
          setSnackbar({
            open: true,
            message: 'You can only edit your own KPIs',
            severity: 'error'
          });
          navigate('/performance/kpi-list');
          return;
        }

        setFormData({
          periodYear: kpi.period_year,
          periodMonth: kpi.period_month,
          appraisalCategoryId: kpi.appraisal_category_id.toString(),
        });
        setKpiItems(kpi.items || []);
        if (kpi.overall_comment) setOverallComments(kpi.overall_comment);
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to load KPI', severity: 'error' });
      }
    } catch (error) {
      console.error('Error loading KPI:', error);
      setSnackbar({ open: true, message: 'Failed to load KPI', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [userRole, navigate]);

  useEffect(() => {
    loadCategories();
    if (isEdit && id) {
      loadKPI(parseInt(id));
    }
  }, [isEdit, id, loadCategories, loadKPI]);

  const checkExistingKPI = React.useCallback(async () => {
    if (!formData.periodYear || !formData.periodMonth || isEdit) {
      return;
    }

    try {
      let employeeId: number | null = null;
      const storedEmployeeId = localStorage.getItem('employeeId');
      if (storedEmployeeId) {
        employeeId = parseInt(storedEmployeeId);
      } else {
        const userResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.data && userData.data.employeeId) {
            employeeId = userData.data.employeeId;
          }
        }
      }

      if (!employeeId) return;

      // Check if KPI exists for this period by fetching all KPIs and filtering
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const existingKPI = result.data.find((kpi: any) =>
            kpi.employee_id === employeeId &&
            kpi.period_year === formData.periodYear &&
            kpi.period_month === formData.periodMonth
          );

          // Only show warning if KPI is in DRAFT status (can be edited)
          // Don't show popup if KPI is already forwarded/submitted
          if (existingKPI && existingKPI.status === 'DRAFT') {
            setSnackbar({
              open: true,
              message: `A draft KPI already exists for ${formData.periodYear}-${String(formData.periodMonth).padStart(2, '0')}. You can edit it or select a different period.`,
              severity: 'info'
            });
          }
        }
      }
    } catch (error) {
      // Silently fail - this is just a warning check
      console.log('Could not check for existing KPI:', error);
    }
  }, [formData.periodYear, formData.periodMonth, isEdit]);

  useEffect(() => {
    if (formData.periodYear && formData.periodMonth && !isEdit) {
      const timer = setTimeout(() => {
        checkExistingKPI();
      }, 1000); // Debounce check
      return () => clearTimeout(timer);
    }
  }, [formData.periodYear, formData.periodMonth, isEdit, checkExistingKPI]);



  const handleAddGoal = () => {
    if (!currentGoal.title || !currentGoal.description || !currentGoal.targetDate) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    if (editingGoalIndex !== null) {
      const updated = [...goals];
      updated[editingGoalIndex] = { ...currentGoal };
      setGoals(updated);
      setEditingGoalIndex(null);
    } else {
      setGoals([...goals, { ...currentGoal, id: Date.now() }]);
    }

    setCurrentGoal({
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      targetDate: '',
      status: 'NOT_STARTED',
      progress: 0,
    });
    setGoalDialogOpen(false);
  };

  const handleEditGoal = (index: number) => {
    setCurrentGoal({ ...goals[index] });
    setEditingGoalIndex(index);
    setGoalDialogOpen(true);
  };

  const handleDeleteGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.description || currentItem.weightage <= 0 || currentItem.targetValue <= 0) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    if (editingItemIndex !== null) {
      // Update existing item
      const updated = [...kpiItems];
      updated[editingItemIndex] = { ...currentItem };
      setKpiItems(updated);
      setEditingItemIndex(null);
    } else {
      // Add new item
      setKpiItems([...kpiItems, { ...currentItem, id: Date.now() }]);
    }

    setCurrentItem({
      name: '',
      category: 'TECHNICAL',
      description: '',
      weightage: 0,
      targetValue: 0,
      actualValue: 0,
      unit: '',
      measurementMethod: '',
    });
    setItemDialogOpen(false);
  };

  const handleEditItem = (index: number) => {
    setCurrentItem({ ...kpiItems[index] });
    setEditingItemIndex(index);
    setItemDialogOpen(true);
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

  const handleDeleteItem = (index: number) => {
    setKpiItems(kpiItems.filter((_, i) => i !== index));
  };

  const handleSave = async (forwardToHR: boolean = false) => {
    // Validate all steps before saving
    if (!formData.appraisalCategoryId) {
      setSnackbar({ open: true, message: 'Please select an appraisal category', severity: 'error' });
      return;
    }

    if (goals.length === 0) {
      setSnackbar({ open: true, message: 'Please add at least one goal', severity: 'error' });
      return;
    }

    if (kpiItems.length === 0) {
      setSnackbar({ open: true, message: 'Please add at least one KPI item', severity: 'error' });
      return;
    }

    const totalWeight = kpiItems.reduce((sum, item) => sum + item.weightage, 0);
    if (totalWeight !== 100) {
      setSnackbar({ open: true, message: `Total weightage must be 100%. Current: ${totalWeight}%`, severity: 'error' });
      return;
    }

    // If on final step (Self Assessment), always forward
    if (activeStep === maxStepForRole) {
      forwardToHR = true;
    }

    try {
      setLoading(true);

      // Get employee ID from backend
      let employeeId: number | null = null;
      const userRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      });
      const userData = await userRes.json();
      if (userData.success && userData.data) {
        employeeId = userData.data.employeeId;
        if (employeeId) localStorage.setItem('employeeId', employeeId.toString());
      }

      // If still no employeeId, try fallback
      if (!employeeId) {
        const stored = localStorage.getItem('employeeId');
        if (stored) employeeId = parseInt(stored);
      }

      if (!employeeId && userRole === 'employee') {
        throw new Error('Employee ID not found. Please contact administrator.');
      }

      // For HR/Admin editing someone else's KPI, we need to know whose it is
      let targetEmployeeId = employeeId;
      if (isEdit && id) {
        const kpiRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        });
        const kpiResData = await kpiRes.json();
        if (kpiResData.success && kpiResData.data) {
          targetEmployeeId = kpiResData.data.employee_id;
        }
      }

      const bodyData = {
        employeeId: targetEmployeeId,
        periodYear: formData.periodYear,
        periodMonth: formData.periodMonth,
        appraisalCategoryId: parseInt(formData.appraisalCategoryId),
        items: kpiItems.map(item => ({
          title: item.name,
          description: item.description,
          weight: item.weightage,
          employeeTarget: `${item.targetValue} ${item.unit || ''}`.trim(),
        })),
        overallComment: overallComments
      };

      let kpiId = id;
      if (isEdit && id) {
        const updateRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(bodyData),
        });
        const updateResult = await updateRes.json();
        if (!updateResult.success) throw new Error(updateResult.message || 'Update failed');
      } else {
        const createRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(bodyData),
        });
        const createResult = await createRes.json();
        if (!createResult.success) {
          if (createResult.existingKpiId) {
            if (window.confirm('A KPI already exists for this period. Edit it?')) {
              navigate(`/performance/kpi/edit/${createResult.existingKpiId}`);
              return;
            }
          }
          throw new Error(createResult.message || 'Creation failed');
        }
        kpiId = createResult.data.id;
      }

      // Forwarding logic
      if (forwardToHR) {
        // Fetch items again to get actual IDs for score submission
        const fetchKpi = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/${kpiId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        });
        const fetchedData = await fetchKpi.json();

        const submitRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/${kpiId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            items: (fetchedData.data?.items || []).map((item: any, index: number) => ({
              id: item.id,
              employeeSelfScore: kpiItems[index]?.employeeSelfScore || null,
            })),
          }),
        });
        const submitResult = await submitRes.json();
        if (!submitResult.success) throw new Error(submitResult.message || 'Forwarding failed');

        const destination = (userRole === 'hr' || userRole === 'admin') ? 'Admin' : 'HR';
        setSnackbar({
          open: true,
          message: `KPI submitted and forwarded to ${destination} successfully!`,
          severity: 'success'
        });
      } else {
        setSnackbar({ open: true, message: 'KPI saved as draft successfully!', severity: 'success' });
      }

      setTimeout(() => navigate('/performance/kpi-list'), 1500);
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to save KPI', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || `Month ${month}`;
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1 && activeStep < maxStepForRole) {
      // Validate before moving to next step
      if (activeStep === 0) {
        // Validate period selection
        if (!formData.appraisalCategoryId) {
          setSnackbar({ open: true, message: 'Please select an appraisal category', severity: 'error' });
          return;
        }
      } else if (activeStep === 1) {
        // Validate goals
        if (goals.length === 0) {
          setSnackbar({ open: true, message: 'Please add at least one goal', severity: 'error' });
          return;
        }
      } else if (activeStep === 2) {
        // Validate KPI items
        if (kpiItems.length === 0) {
          setSnackbar({ open: true, message: 'Please add at least one KPI item', severity: 'error' });
          return;
        }
        const totalWeight = kpiItems.reduce((sum, item) => sum + item.weightage, 0);
        if (totalWeight !== 100) {
          setSnackbar({ open: true, message: `Total weightage must be 100%. Current: ${totalWeight}%`, severity: 'error' });
          return;
        }
      }
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
  }, [maxStepForRole, activeStep]);

  const totalWeight = kpiItems.reduce((sum, item) => sum + item.weightage, 0);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit KPI' : 'Create New KPI'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive KPI management with self-assessment and review workflow.
      </Typography>

      {/* KPI Progress */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          KPI Progress
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
            Step {activeStep + 1} of {steps.length} {userRole === 'employee' ? '(Employee Access)' : ''}
          </Typography>
        </Box>
      </Paper>

      {/* Step-by-Step Content */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>

        {/* Step 0: Period Selection */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon />
              Step 1: Period Selection
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Select the period and appraisal category for your KPI.
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
                    Show Tips for Period Selection
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Select the appropriate period (year and month) for which you want to create KPIs.
                  Choose the appraisal category that best matches your role and responsibilities. This will help organize
                  your performance metrics effectively.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Period Year</InputLabel>
                  <Select
                    value={formData.periodYear || ''}
                    label="Period Year"
                    onChange={(e) => setFormData({ ...formData, periodYear: e.target.value as number })}
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
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Period Month</InputLabel>
                  <Select
                    value={formData.periodMonth || ''}
                    label="Period Month"
                    onChange={(e) => setFormData({ ...formData, periodMonth: e.target.value as number })}
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
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <MenuItem key={month} value={month}>{getMonthName(month)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Appraisal Category</InputLabel>
                  <Select
                    value={formData.appraisalCategoryId || ''}
                    label="Appraisal Category"
                    onChange={(e) => setFormData({ ...formData, appraisalCategoryId: e.target.value })}
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
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Goal Setting */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon />
              Step 2: Goal Setting
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Define your performance goals and objectives for this appraisal period.
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
                  setCurrentGoal({
                    title: '',
                    description: '',
                    category: '',
                    priority: 'MEDIUM',
                    targetDate: '',
                    status: 'NOT_STARTED',
                    progress: 0,
                  });
                  setEditingGoalIndex(null);
                  setGoalDialogOpen(true);
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
                  {goals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No goals defined yet. Add goals to track performance objectives.
                      </TableCell>
                    </TableRow>
                  ) : (
                    goals.map((goal, index) => (
                      <TableRow key={goal.id || index}>
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
                            color={getPriorityColor(goal.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '-'}</TableCell>
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
                            color={getStatusColor(goal.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditGoal(index)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteGoal(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 2: KPI Definition */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon />
              Step 3: KPI Definition
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Define Key Performance Indicators to measure your performance against goals.
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
                    Show Tips for KPI Definition
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Create clear, measurable KPIs with specific targets. The total weightage of all KPIs
                  should equal 100%. Ensure each KPI is relevant to your role and contributes to organizational goals.
                  Set realistic targets that challenge you while remaining achievable.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                KPI Items
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setCurrentItem({
                    name: '',
                    category: 'TECHNICAL',
                    description: '',
                    weightage: 0,
                    targetValue: 0,
                    actualValue: 0,
                    unit: '',
                    measurementMethod: '',
                  });
                  setEditingItemIndex(null);
                  setItemDialogOpen(true);
                }}
              >
                Add KPI Item
              </Button>
            </Box>

            {totalWeight > 0 && (
              <Alert severity={totalWeight === 100 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                Total Weightage: {totalWeight}% {totalWeight !== 100 && '(Should be 100%)'}
              </Alert>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Weightage (%)</TableCell>
                    <TableCell>Target Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kpiItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No KPI items added yet. Click "Add KPI Item" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kpiItems.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {kpiCategories.find(cat => cat.value === item.category)?.label || item.category}
                        </TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell>{item.weightage}%</TableCell>
                        <TableCell>{item.targetValue} {item.unit || ''}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditItem(index)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteItem(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 3: Self Assessment */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <AssessmentIcon />
              Step 4: Self Assessment
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Rate your performance for each KPI. Be honest and provide evidence for your self-assessment.
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
                    Show Tips for Self Assessment
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.8 }}>
                  💡 <strong>Tip:</strong> Rate your performance objectively for each KPI. Provide specific examples and evidence
                  in your assessment notes. Be honest about achievements and areas for improvement. This self-assessment
                  will be reviewed by HR.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>KPI Title</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Self Score (1-5)</TableCell>
                    <TableCell>Self Assessment Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kpiItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No KPI items to assess. Please go back and add KPI items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kpiItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                        </TableCell>
                        <TableCell>{item.targetValue} {item.unit || ''}</TableCell>
                        <TableCell>
                          <Rating
                            value={item.employeeSelfScore || 0}
                            onChange={(event, newValue) => {
                              const updated = [...kpiItems];
                              updated[index] = { ...updated[index], employeeSelfScore: newValue || 0 };
                              setKpiItems(updated);
                            }}
                            precision={0.5}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            multiline
                            rows={2}
                            placeholder="Your assessment..."
                            value={item.selfAssessmentNotes || ''}
                            onChange={(e) => {
                              const updated = [...kpiItems];
                              updated[index] = { ...updated[index], selfAssessmentNotes: e.target.value };
                              setKpiItems(updated);
                            }}
                            sx={{ width: 250 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Overall Self-Assessment Comments"
                multiline
                rows={4}
                value={overallComments}
                onChange={(e) => setOverallComments(e.target.value)}
                placeholder="Provide overall self-assessment comments..."
              />
            </Box>
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
            {activeStep < steps.length - 1 && activeStep < maxStepForRole ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
            ) : activeStep === maxStepForRole ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/performance/kpi-list')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => handleSave(true)}
                  disabled={loading}
                  color="primary"
                >
                  {userRole === 'hr' || userRole === 'admin' ? 'Save & Forward to Admin' : 'Save & Forward to HR'}
                </Button>
              </>
            ) : null}
          </Box>
        </Box>
      </Paper>

      {/* Add/Edit KPI Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItemIndex !== null ? 'Edit KPI' : 'Add New KPI'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="KPI Name *"
                required
                value={currentItem.name}
                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={currentItem.category}
                  label="Category *"
                  onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value as any })}
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
                  {kpiCategories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                required
                multiline
                rows={3}
                value={currentItem.description}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Weightage (%) *"
                type="number"
                required
                value={currentItem.weightage}
                onChange={(e) => setCurrentItem({ ...currentItem, weightage: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Value *"
                type="number"
                required
                value={currentItem.targetValue}
                onChange={(e) => setCurrentItem({ ...currentItem, targetValue: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Actual Value"
                type="number"
                value={currentItem.actualValue}
                onChange={(e) => setCurrentItem({ ...currentItem, actualValue: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit"
                value={currentItem.unit}
                onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                placeholder="e.g., %, hours, projects"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Measurement Method"
                value={currentItem.measurementMethod}
                onChange={(e) => setCurrentItem({ ...currentItem, measurementMethod: e.target.value })}
                placeholder="e.g., Code review scores, Customer feedback"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddItem}>
            {editingItemIndex !== null ? 'Update KPI' : 'Add KPI'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingGoalIndex !== null ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Goal Title *"
                required
                value={currentGoal.title}
                onChange={(e) => setCurrentGoal({ ...currentGoal, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                required
                multiline
                rows={3}
                value={currentGoal.description}
                onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={currentGoal.category}
                  label="Category"
                  onChange={(e) => setCurrentGoal({ ...currentGoal, category: e.target.value })}
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
                  {goalCategories.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={currentGoal.priority}
                  label="Priority"
                  onChange={(e) => setCurrentGoal({ ...currentGoal, priority: e.target.value as any })}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Date *"
                type="date"
                required
                value={currentGoal.targetDate}
                onChange={(e) => setCurrentGoal({ ...currentGoal, targetDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={currentGoal.status}
                  label="Status"
                  onChange={(e) => setCurrentGoal({ ...currentGoal, status: e.target.value as any })}
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
                  <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="DELAYED">Delayed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Progress (%)"
                type="number"
                value={currentGoal.progress}
                onChange={(e) => setCurrentGoal({ ...currentGoal, progress: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddGoal}>
            {editingGoalIndex !== null ? 'Update Goal' : 'Add Goal'}
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

export default CreateKPIForm;

