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

const HRKPIReview: React.FC = () => {
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
    if (user?.role === 'hr') {
      loadKPIs();
    }
  }, [user]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/hr/review`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setKpis(result.data || []);
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to load KPIs',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load KPIs. Please check your connection.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewKPI = (kpi: KPI) => {
    setSelectedKPI(kpi);
    // Initialize review scores with existing HR scores or employee self scores
    const scores: { [key: number]: number } = {};
    kpi.items.forEach((item) => {
      scores[item.id] = item.hr_score || item.employee_self_score || 0;
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
        `${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi/${selectedKPI.id}/manager-review`,
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
        setSnackbar({
          open: true,
          message: result.message || `KPI ${action === 'APPROVED' ? 'approved and forwarded to Admin' : 'returned for changes'}`,
          severity: 'success',
        });
        setReviewDialogOpen(false);
        setSelectedKPI(null);
        setReviewScores({});
        setOverallComment('');
        loadKPIs(); // Reload the list
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
      case 'HR_REVIEW':
        return 'warning';
      case 'ADMIN_REVIEW':
        return 'info';
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

  if (user?.role !== 'hr') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. This page is only accessible to HR users.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        HR KPI Review
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review and approve employee-submitted KPIs. Approved KPIs will be forwarded to Admin for further review.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : kpis.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No KPIs pending HR review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            There are no KPIs currently assigned to HR for review.
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
              HR Review - {selectedKPI?.first_name} {selectedKPI?.last_name}
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
              <Alert severity="info" sx={{ mb: 3 }}>
                Review the KPI items and provide HR scores. You can approve to forward to Admin or return for changes.
              </Alert>

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
                          <TableCell>Employee Score</TableCell>
                          <TableCell>HR Score</TableCell>
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
                  placeholder="Provide overall HR feedback and comments..."
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
            {submitting ? 'Submitting...' : 'Approve & Forward to Admin'}
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

export default HRKPIReview;




