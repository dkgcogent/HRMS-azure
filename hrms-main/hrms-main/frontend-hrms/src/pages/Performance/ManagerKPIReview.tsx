// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Alert,
  Snackbar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface KPIItem {
  id: number;
  title: string;
  description: string;
  weight: number;
  employee_target: string;
  employee_self_score: number | null;
  hr_score: number | null;
  manager_score: number | null;
  dept_head_score: number | null;
  ceo_score: number | null;
}

interface KPI {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  period_year: number;
  period_month: number;
  category_name: string;
  status: string;
  current_reviewer_role: string;
  submitted_at: string;
  items: KPIItem[];
}

const reviewStages = [
  { status: 'ADMIN_REVIEW', label: 'Admin Review', role: 'Manager' },
  { status: 'MANAGER_REVIEW', label: 'Manager Review', role: 'Dept Head' },
  { status: 'DEPT_HEAD_REVIEW', label: 'Dept Head Review', role: 'CEO' },
  { status: 'CEO_APPROVAL', label: 'CEO Approval', role: 'Final' },
];

const ManagerKPIReview: React.FC = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewScores, setReviewScores] = useState<{ [key: number]: number }>({});
  const [overallComment, setOverallComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadKPIs();
    }
  }, [user]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication token not found. Please login again.',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      const apiUrl = `${process.env.REACT_APP_API_URL === '/' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3004')}/api/kpi/admin/review`;
      console.log('[ManagerKPIReview] ====== Starting KPI Load ======');
      console.log('[ManagerKPIReview] API URL:', apiUrl);
      console.log('[ManagerKPIReview] Auth token present:', !!token);
      console.log('[ManagerKPIReview] Auth token length:', token?.length);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[ManagerKPIReview] Response received');
      console.log('[ManagerKPIReview] Response status:', response.status);
      console.log('[ManagerKPIReview] Response statusText:', response.statusText);
      console.log('[ManagerKPIReview] Response ok:', response.ok);
      console.log('[ManagerKPIReview] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ManagerKPIReview] Error response:', errorText);
        let errorMessage = 'Failed to load KPIs';

        // Provide specific error messages based on status code
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to view KPIs. Admin role required.';
        } else if (response.status === 404) {
          // Try to get more details from error response
          let detailedError = 'API endpoint not found';
          try {
            const errorJson = JSON.parse(errorText);
            detailedError = errorJson.message || detailedError;
            console.error('[ManagerKPIReview] 404 Error details:', errorJson);
          } catch (e) {
            console.error('[ManagerKPIReview] 404 Error text (not JSON):', errorText);
          }
          errorMessage = `${detailedError}. Please verify: 1) Backend is running on ${process.env.REACT_APP_API_URL === '/' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3004')}, 2) Route /api/kpi/admin/review exists, 3) You are logged in as Admin user.`;
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please check backend logs and database connection.';
        } else if (response.status === 0 || response.status === 'undefined') {
          errorMessage = `Cannot connect to backend server. Please ensure the backend is running on ${process.env.REACT_APP_API_URL === '/' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3004')}`;
        }

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          // If errorText is not JSON, use the status-based message or the raw text
          if (errorText && errorText.trim() && !errorMessage.includes('Cannot connect')) {
            errorMessage = `${errorMessage} (${response.status}): ${errorText.substring(0, 100)}`;
          }
        }

        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
        setKpis([]);
        return;
      }

      const result = await response.json();
      console.log('[ManagerKPIReview] Response data:', result);

      if (result.success) {
        setKpis(result.data || []);
        console.log(`[ManagerKPIReview] Loaded ${result.data?.length || 0} KPIs`);
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to load KPIs',
          severity: 'error',
        });
        setKpis([]);
      }
    } catch (error: any) {
      console.error('[ManagerKPIReview] Error loading KPIs:', error);

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to load KPIs';

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = `Cannot connect to backend server. Please ensure backend is running on ${process.env.REACT_APP_API_URL === '/' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3004')} and check browser console for details.`;
      } else if (error.message) {
        errorMessage = `Failed to load KPIs: ${error.message}`;
      } else {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running.';
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      setKpis([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageIndex = (status: string) => {
    return reviewStages.findIndex(stage => stage.status === status);
  };

  const getScoreFieldForStatus = (status: string): keyof KPIItem => {
    switch (status) {
      case 'ADMIN_REVIEW':
        return 'manager_score';
      case 'MANAGER_REVIEW':
        return 'dept_head_score';
      case 'DEPT_HEAD_REVIEW':
        return 'ceo_score';
      case 'CEO_APPROVAL':
        return 'ceo_score';
      default:
        return 'hr_score';
    }
  };

  const handleViewKPI = (kpi: KPI) => {
    setSelectedKPI(kpi);
    // Initialize review scores with existing scores for current stage
    const scores: { [key: number]: number } = {};
    const scoreField = getScoreFieldForStatus(kpi.status);
    kpi.items.forEach((item) => {
      scores[item.id] = item[scoreField] || item.hr_score || item.employee_self_score || 0;
    });
    setReviewScores(scores);
    setOverallComment('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async (action: 'APPROVED' | 'RETURNED') => {
    if (!selectedKPI) return;

    // Validate scores if approving
    if (action === 'APPROVED') {
      const hasScores = Object.values(reviewScores).some(score => score > 0);
      if (!hasScores) {
        setSnackbar({
          open: true,
          message: 'Please provide scores for at least one KPI item before approving.',
          severity: 'warning',
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const items = selectedKPI.items.map((item) => ({
        id: item.id,
        managerScore: reviewScores[item.id] || null,
      }));

      const response = await fetch(
        `${process.env.REACT_APP_API_URL === '/' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3004')}/api/kpi/${selectedKPI.id}/manager-review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            items,
            overallComment,
            action,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        const isCompleted = result.data?.completed || (selectedKPI.status === 'CEO_APPROVAL' && action === 'APPROVED');

        let message = result.message || 'Review submitted successfully.';
        if (isCompleted) {
          message = 'KPI approved and completed successfully!';
        }

        setSnackbar({
          open: true,
          message: message,
          severity: 'success',
        });
        setReviewDialogOpen(false);
        setSelectedKPI(null);
        setReviewScores({});
        setOverallComment('');

        // Reload the list to show updated status
        console.log('[ManagerKPIReview] Reloading KPIs after review submission...');
        await loadKPIs();

        // If completed, show additional confirmation
        if (isCompleted) {
          setTimeout(() => {
            setSnackbar({
              open: true,
              message: 'KPI has been completed and is now visible in the KPI List.',
              severity: 'info',
            });
          }, 2000);
        }
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to submit review',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit review. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ADMIN_REVIEW':
      case 'MANAGER_REVIEW':
      case 'DEPT_HEAD_REVIEW':
      case 'CEO_APPROVAL':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'RETURNED_FOR_CHANGES':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || `Month ${month}`;
  };

  const getCurrentStageLabel = (status: string) => {
    const stage = reviewStages.find(s => s.status === status);
    return stage ? stage.label : status;
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. This page is only accessible to Admin users.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Admin KPI Review
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review KPIs in sequential stages: Admin Review → Manager Review → Dept Head Review → CEO Approval
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : kpis.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No KPIs pending Admin review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            There are no KPIs currently assigned to Admin for review.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Current Stage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kpis.map((kpi) => (
                <TableRow key={kpi.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {kpi.first_name} {kpi.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {kpi.employee_code || kpi.employee_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getMonthName(kpi.period_month)} {kpi.period_year}
                  </TableCell>
                  <TableCell>{kpi.category_name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {getCurrentStageLabel(kpi.status)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={kpi.status}
                      color={getStatusColor(kpi.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {kpi.submitted_at
                      ? new Date(kpi.submitted_at).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{kpi.items?.length || 0} items</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewKPI(kpi)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => !submitting && setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            <Typography variant="h6">
              Admin Review - {selectedKPI?.first_name} {selectedKPI?.last_name}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Period: {selectedKPI && getMonthName(selectedKPI.period_month)} {selectedKPI?.period_year} |
            Category: {selectedKPI?.category_name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedKPI && (
            <Box>
              {/* Review Stage Progress */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Review Progress
                </Typography>
                <Stepper activeStep={getCurrentStageIndex(selectedKPI.status)} alternativeLabel>
                  {reviewStages.map((stage) => (
                    <Step key={stage.status}>
                      <StepLabel>{stage.label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Current Stage: <strong>{getCurrentStageLabel(selectedKPI.status)}</strong>
                  {getCurrentStageIndex(selectedKPI.status) < reviewStages.length - 1 && (
                    <> → Next: {reviewStages[getCurrentStageIndex(selectedKPI.status) + 1]?.label}</>
                  )}
                </Alert>
              </Paper>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">KPI Items ({selectedKPI.items.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Target</TableCell>
                          <TableCell>Employee</TableCell>
                          <TableCell>HR</TableCell>
                          <TableCell>{getCurrentStageLabel(selectedKPI.status)}</TableCell>
                          <TableCell>Weight</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedKPI.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.title}
                              </Typography>
                              {item.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                {item.employee_target}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {item.employee_self_score !== null ? (
                                <Rating
                                  value={item.employee_self_score}
                                  readOnly
                                  precision={0.1}
                                  size="small"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.hr_score !== null ? (
                                <Rating
                                  value={item.hr_score}
                                  readOnly
                                  precision={0.1}
                                  size="small"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Rating
                                value={reviewScores[item.id] || 0}
                                onChange={(event, newValue) => {
                                  setReviewScores({
                                    ...reviewScores,
                                    [item.id]: newValue || 0,
                                  });
                                }}
                                precision={0.5}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{item.weight}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Overall Comments"
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  placeholder="Provide overall feedback and comments for this review stage..."
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setReviewDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleSubmitReview('RETURNED')}
            disabled={submitting}
          >
            Return for Changes
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleSubmitReview('APPROVED')}
            disabled={submitting}
          >
            {submitting
              ? 'Submitting...'
              : getCurrentStageIndex(selectedKPI?.status || '') < reviewStages.length - 1
                ? `Approve & Move to ${reviewStages[getCurrentStageIndex(selectedKPI?.status || '') + 1]?.label}`
                : 'Approve & Complete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManagerKPIReview;
