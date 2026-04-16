import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Receipt,
  Download,
  FilterList,
  Person,
} from '@mui/icons-material';
import { apiService, ExpenseRequest } from '../../services/api';
import CSVExportButton from '../../components/CSVExportButton';

const ExpenseApprovalForm: React.FC = () => {
  const [expenseClaims, setExpenseClaims] = useState<ExpenseRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    expenseClaim: ExpenseRequest | null;
    action: 'APPROVED' | 'REJECTED' | null;
  }>({ open: false, expenseClaim: null, action: null });
  
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    expenseClaim: ExpenseRequest | null;
  }>({ open: false, expenseClaim: null });

  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchExpenseClaims();
  }, []);

  const fetchExpenseClaims = async () => {
    setLoading(true);
    try {
      const response = await apiService.getExpenseRequests();
      if (response.success) {
        setExpenseClaims(response.data || []);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to fetch expense claims',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (expenseClaim: ExpenseRequest, action: 'APPROVED' | 'REJECTED') => {
    setActionDialog({
      open: true,
      expenseClaim,
      action,
    });
    setComments('');
  };

  const handleViewDetails = (expenseClaim: ExpenseRequest) => {
    setDetailDialog({
      open: true,
      expenseClaim,
    });
  };

  const confirmApprovalAction = async () => {
    if (!actionDialog.expenseClaim || !actionDialog.action) return;

    setLoading(true);
    try {
      await apiService.updateExpenseRequestStatus(
        actionDialog.expenseClaim.id!,
        actionDialog.action,
        1 // Pass the admin user ID here
      );
      setAlert({
        type: 'success',
        message: `Expense claim ${actionDialog.action.toLowerCase()}d successfully`,
      });
      fetchExpenseClaims();
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to process expense claim',
      });
    } finally {
      setLoading(false);
      setActionDialog({ open: false, expenseClaim: null, action: null });
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'SUBMITTED': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PAID': return 'info';
      default: return 'default';
    }
  };

  const filteredClaims = expenseClaims.filter(claim => {
    if (selectedTab === 0) return claim.status === 'PENDING';
    if (selectedTab === 1) return claim.status === 'APPROVED';
    if (selectedTab === 2) return claim.status === 'REJECTED';
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Expense Approval Management
          </Typography>
          <CSVExportButton
            exportType="EXPENSE"
            variant="outlined"
            color="primary"
          />
        </Box>

        {alert && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 3 }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}

        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
          <Tab label={`Pending (${expenseClaims.filter(c => c.status === 'PENDING').length})`} />
          <Tab label={`Approved (${expenseClaims.filter(c => c.status === 'APPROVED').length})`} />
          <Tab label={`Rejected (${expenseClaims.filter(c => c.status === 'REJECTED').length})`} />
          <Tab label="All" />
        </Tabs>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {claim.employeeId} 
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {claim.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(claim.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={claim.status}
                      color={getStatusColor(claim.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(claim)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {claim.status === 'PENDING' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprovalAction(claim, 'APPROVED')}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleApprovalAction(claim, 'REJECTED')}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredClaims.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No expense claims found
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog({ open: false, expenseClaim: null, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.action} Expense Claim
        </DialogTitle>
        <DialogContent>
          {actionDialog.expenseClaim && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {actionDialog.expenseClaim.employeeId}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {actionDialog.expenseClaim.description}
              </Typography>
              <Typography variant="h6" color="primary.main" gutterBottom>
                Total Amount: {formatCurrency(actionDialog.expenseClaim.amount)}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            label={actionDialog.action === 'APPROVED' ? 'Approval Comments (Optional)' : 'Rejection Reason'}
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required={actionDialog.action === 'REJECTED'}
            placeholder={
              actionDialog.action === 'APPROVED'
                ? 'Add any comments for approval...'
                : 'Please provide reason for rejection...'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialog({ open: false, expenseClaim: null, action: null })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmApprovalAction}
            variant="contained"
            color={actionDialog.action === 'APPROVED' ? 'success' : 'error'}
            disabled={loading || (actionDialog.action === 'REJECTED' && !comments.trim())}
          >
            {loading ? 'Processing...' : `${actionDialog.action} Claim`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={detailDialog.open} 
        onClose={() => setDetailDialog({ open: false, expenseClaim: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Expense Claim Details</DialogTitle>
        <DialogContent>
          {detailDialog.expenseClaim && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Employee Information
              </Typography>
              <Typography variant="body2"><strong>Employee ID:</strong> {detailDialog.expenseClaim.employeeId}</Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Claim Information
              </Typography>
              <Typography variant="body2"><strong>Description:</strong> {detailDialog.expenseClaim.description}</Typography>
              <Typography variant="body2"><strong>Amount:</strong> {formatCurrency(detailDialog.expenseClaim.amount)}</Typography>
              <Chip
                label={detailDialog.expenseClaim.status}
                color={getStatusColor(detailDialog.expenseClaim.status) as any}
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, expenseClaim: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExpenseApprovalForm;
