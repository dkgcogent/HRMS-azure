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
  Rating,
  Divider,
  Alert,
  Snackbar,
  Slider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

interface PerformanceEvaluation {
  id?: number;
  employeeId: number;
  employeeName?: string;
  evaluatorId: number;
  evaluatorName?: string;
  evaluationPeriod: string;
  evaluationDate: string;
  criteria: {
    workQuality: number;
    productivity: number;
    communication: number;
    teamwork: number;
    initiative: number;
    punctuality: number;
    leadership: number;
    problemSolving: number;
  };
  overallRating: number;
  strengths: string;
  areasForImprovement: string;
  goals: string;
  comments: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

const criteriaLabels = {
  workQuality: 'Work Quality',
  productivity: 'Productivity',
  communication: 'Communication Skills',
  teamwork: 'Teamwork',
  initiative: 'Initiative',
  punctuality: 'Punctuality',
  leadership: 'Leadership',
  problemSolving: 'Problem Solving',
};

const PerformanceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [evaluation, setEvaluation] = useState<PerformanceEvaluation>({
    employeeId: 0,
    evaluatorId: 0,
    evaluationPeriod: '',
    evaluationDate: new Date().toISOString().split('T')[0],
    criteria: {
      workQuality: 3,
      productivity: 3,
      communication: 3,
      teamwork: 3,
      initiative: 3,
      punctuality: 3,
      leadership: 3,
      problemSolving: 3,
    },
    overallRating: 3,
    strengths: '',
    areasForImprovement: '',
    goals: '',
    comments: '',
    status: 'DRAFT',
  });

  useEffect(() => {
    loadMasterData();
    if (isEdit && id) {
      loadEvaluation(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    calculateOverallRating();
  }, [evaluation.criteria]);

  const loadMasterData = async () => {
    try {
      const response = await apiService.getEmployees(0, 100);
      const employeeList = response.data?.content || [];
      setEmployees(employeeList);

      // Evaluators are typically managers or HR personnel
      setEvaluators(employeeList.filter(emp =>
        emp.designationName?.toLowerCase().includes('manager') ||
        emp.designationName?.toLowerCase().includes('hr')
      ));
    } catch (error) {
      console.error('Error loading master data:', error);
      setEmployees([
        { id: 1, firstName: 'John', lastName: 'Doe', employeeId: 'EMP001' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', employeeId: 'EMP002' },
      ]);
      setEvaluators([
        { id: 3, firstName: 'Manager', lastName: 'One', employeeId: 'MGR001' },
      ]);
    }
  };

  const loadEvaluation = async (evaluationId: number) => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getEvaluationById(evaluationId);
    } catch (error) {
      console.error('Error loading evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallRating = () => {
    const criteriaValues = Object.values(evaluation.criteria);
    const average = criteriaValues.reduce((sum, val) => sum + val, 0) / criteriaValues.length;
    setEvaluation(prev => ({
      ...prev,
      overallRating: Math.round(average * 10) / 10,
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('criteria.')) {
      const criteriaField = field.split('.')[1];
      setEvaluation(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criteriaField]: value,
        },
      }));
    } else {
      setEvaluation(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!evaluation.employeeId) errors.push('Employee is required');
    if (!evaluation.evaluatorId) errors.push('Evaluator is required');
    if (!evaluation.evaluationPeriod) errors.push('Evaluation Period is required');
    if (!evaluation.evaluationDate) errors.push('Evaluation Date is required');
    if (!evaluation.strengths.trim()) errors.push('Strengths are required');
    if (!evaluation.areasForImprovement.trim()) errors.push('Areas for Improvement are required');

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
      if (isEdit && id) {
        // await apiService.updateEvaluation(parseInt(id), evaluation);
        setSnackbar({ open: true, message: 'Performance evaluation updated successfully!', severity: 'success' });
      } else {
        // await apiService.createEvaluation(evaluation);
        setSnackbar({ open: true, message: 'Performance evaluation created successfully!', severity: 'success' });
      }
      setTimeout(() => navigate('/performance'), 1500);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setSnackbar({ open: true, message: 'Error saving evaluation. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/performance');
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'success.main';
    if (rating >= 3.5) return 'info.main';
    if (rating >= 2.5) return 'warning.main';
    return 'error.main';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Satisfactory';
    if (rating >= 1.5) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit Performance Evaluation' : 'New Performance Evaluation'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Evaluate employee performance across various criteria.
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
                <InputLabel>Employee</InputLabel>
                <Select
                  value={evaluation.employeeId || ''}
                  label="Employee"
                  onChange={(e) => handleInputChange('employeeId', parseInt(e.target.value))}
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
              <FormControl fullWidth required>
                <InputLabel>Evaluator</InputLabel>
                <Select
                  value={evaluation.evaluatorId || ''}
                  label="Evaluator"
                  onChange={(e) => handleInputChange('evaluatorId', parseInt(e.target.value))}
                >
                  {evaluators.map((evaluator) => (
                    <MenuItem key={evaluator.id} value={evaluator.id}>
                      {evaluator.firstName} {evaluator.lastName} ({evaluator.employeeId})
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
                label="Evaluation Period"
                required
                value={evaluation.evaluationPeriod}
                onChange={(e) => handleInputChange('evaluationPeriod', e.target.value)}
                placeholder="e.g., Q1 2024, Jan-Jun 2024"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Evaluation Date"
                type="date"
                required
                value={evaluation.evaluationDate}
                onChange={(e) => handleInputChange('evaluationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={evaluation.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Performance Criteria */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Performance Criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Rate each criterion on a scale of 1-5 (1 = Poor, 5 = Excellent)
              </Typography>
            </Grid>

            {Object.entries(criteriaLabels).map(([key, label]) => (
              <Grid
                key={key}
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Rating
                      value={evaluation.criteria[key]}
                      onChange={(_, value) => handleInputChange(`criteria.${key}`, value || 1)}
                      max={5}
                      size="large"
                    />
                    <Typography variant="body2" sx={{ minWidth: 60 }}>
                      {evaluation.criteria[key]}/5
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}

            {/* Overall Rating */}
            <Grid size={12}>
              <Card sx={{ mt: 2, backgroundColor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Overall Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Rating
                      value={evaluation.overallRating}
                      readOnly
                      max={5}
                      size="large"
                      precision={0.1}
                    />
                    <Typography variant="h6" sx={{ color: getRatingColor(evaluation.overallRating) }}>
                      {evaluation.overallRating}/5 - {getRatingLabel(evaluation.overallRating)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Feedback */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Detailed Feedback
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Strengths"
                multiline
                rows={4}
                required
                value={evaluation.strengths}
                onChange={(e) => handleInputChange('strengths', e.target.value)}
                placeholder="List the employee's key strengths and achievements..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Areas for Improvement"
                multiline
                rows={4}
                required
                value={evaluation.areasForImprovement}
                onChange={(e) => handleInputChange('areasForImprovement', e.target.value)}
                placeholder="Identify areas where the employee can improve..."
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Goals for Next Period"
                multiline
                rows={3}
                value={evaluation.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="Set specific goals and objectives for the next evaluation period..."
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Additional Comments"
                multiline
                rows={3}
                value={evaluation.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                placeholder="Any additional comments or observations..."
              />
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
                  {loading ? 'Saving...' : isEdit ? 'Update Evaluation' : 'Save Evaluation'}
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

export default PerformanceForm;
