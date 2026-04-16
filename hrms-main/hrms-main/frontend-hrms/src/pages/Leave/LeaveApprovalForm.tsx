// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import CSVExportButton from '../../components/CSVExportButton';

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  employeePhoto?: string;
  departmentName: string;
  designationName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate: string;
  approvedBy?: number;
  approvedDate?: string;
  approverRemarks?: string;
  reportingManager: string;
  leaveBalance: number;
}

interface ApprovalAction {
  leaveId: number;
  action: 'APPROVE' | 'REJECT';
  remarks: string;
}

const LeaveApprovalForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>({
    leaveId: 0,
    action: 'APPROVE',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [statusFilter, leaveRequests]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getPendingLeaveRequests();
      // Mock data for demonstration
      const mockRequests: LeaveRequest[] = [
        {
          id: 1,
          employeeId: 101,
          employeeName: 'John Doe',
          departmentName: 'Information Technology',
          designationName: 'Software Engineer',
          leaveType: 'Annual Leave',
          startDate: '2024-04-15',
          endDate: '2024-04-17',
          totalDays: 3,
          reason: 'Family vacation to Goa',
          status: 'PENDING',
          appliedDate: '2024-04-01',
          reportingManager: 'Jane Smith',
          leaveBalance: 18,
        },
        {
          id: 2,
          employeeId: 102,
          employeeName: 'Alice Johnson',
          departmentName: 'Human Resources',
          designationName: 'HR Executive',
          leaveType: 'Sick Leave',
          startDate: '2024-04-10',
          endDate: '2024-04-11',
          totalDays: 2,
          reason: 'Fever and cold symptoms',
          status: 'PENDING',
          appliedDate: '2024-04-09',
          reportingManager: 'Jane Smith',
          leaveBalance: 8,
        },
        {
          id: 3,
          employeeId: 103,
          employeeName: 'Mike Wilson',
          departmentName: 'Finance',
          designationName: 'Accountant',
          leaveType: 'Casual Leave',
          startDate: '2024-04-20',
          endDate: '2024-04-20',
          totalDays: 1,
          reason: 'Personal work',
          status: 'APPROVED',
          appliedDate: '2024-04-05',
          approvedBy: 1,
          approvedDate: '2024-04-06',
          approverRemarks: 'Approved as requested',
          reportingManager: 'Jane Smith',
          leaveBalance: 10,
        },
      ];
      setLeaveRequests(mockRequests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      setSnackbar({ open: true, message: 'Error loading leave requests', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (statusFilter === 'ALL') {
      setFilteredRequests(leaveRequests);
    } else {
      setFilteredRequests(leaveRequests.filter(req => req.status === statusFilter));
    }
  };

  const handleViewDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
  };

  const handleApprovalAction = (request: LeaveRequest, action: 'APPROVE' | 'REJECT') => {
    setApprovalAction({
      leaveId: request.id,
      action: action,
      remarks: '',
    });
    setApprovalDialog(true);
  };

  const submitApproval = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.approveLeaveRequest(approvalAction);
      
      // Update local state
      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === approvalAction.leaveId 
            ? {
                ...req,
                status: approvalAction.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                approvedBy: 1, // Current user ID
                approvedDate: new Date().toISOString().split('T')[0],
                approverRemarks: approvalAction.remarks,
              }
            : req
        )
      );

      setSnackbar({
        open: true,
        message: `Leave request ${approvalAction.action.toLowerCase()}d successfully!`,
        severity: 'success'
      });
      
      setApprovalDialog(false);
      setApprovalAction({ leaveId: 0, action: 'APPROVE', remarks: '' });
    } catch (error) {
      console.error('Error processing approval:', error);
      setSnackbar({ open: true, message: 'Error processing approval', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const calculateLeaveDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Leave Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and approve employee leave requests.
          </Typography>
        </Box>
        <CSVExportButton
          exportType="LEAVE"
          variant="outlined"
          color="primary"
        />
      </Box>
      {/* Filter Controls */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid
            size={{
              xs: 12,
              md: 3
            }}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="PENDING">Pending Approval</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="ALL">All Requests</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 9
            }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Requests: {filteredRequests.length}
              </Typography>
              <Chip 
                label={`Pending: ${leaveRequests.filter(r => r.status === 'PENDING').length}`} 
                color="warning" 
                size="small" 
              />
              <Chip 
                label={`Approved: ${leaveRequests.filter(r => r.status === 'APPROVED').length}`} 
                color="success" 
                size="small" 
              />
              <Chip 
                label={`Rejected: ${leaveRequests.filter(r => r.status === 'REJECTED').length}`} 
                color="error" 
                size="small" 
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      {/* Leave Requests Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Leave Details</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {request.employeeName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {request.employeeName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.departmentName} • {request.designationName}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Balance: {request.leaveBalance} days
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {request.leaveType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Applied: {new Date(request.appliedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.totalDays} day(s)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {request.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                    {request.approverRemarks && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {request.approverRemarks}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(request)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {request.status === 'PENDING' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleApprovalAction(request, 'APPROVE')}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleApprovalAction(request, 'REJECT')}
                            >
                              <RejectIcon />
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

        {filteredRequests.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No leave requests found for the selected filter.
            </Typography>
          </Box>
        )}
      </Paper>
      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction.action === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Remarks"
            multiline
            rows={4}
            value={approvalAction.remarks}
            onChange={(e) => setApprovalAction(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder={`Add remarks for ${approvalAction.action.toLowerCase()}ing this leave request...`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submitApproval}
            color={approvalAction.action === 'APPROVE' ? 'success' : 'error'}
            disabled={loading}
          >
            {loading ? 'Processing...' : `${approvalAction.action === 'APPROVE' ? 'Approve' : 'Reject'} Request`}
          </Button>
        </DialogActions>
      </Dialog>
      {/* View Details Dialog */}
      <Dialog open={!!selectedRequest} onClose={() => setSelectedRequest(null)} maxWidth="md" fullWidth>
        <DialogTitle>Leave Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Typography variant="h6" gutterBottom>Employee Information</Typography>
                <Typography><strong>Name:</strong> {selectedRequest.employeeName}</Typography>
                <Typography><strong>Department:</strong> {selectedRequest.departmentName}</Typography>
                <Typography><strong>Designation:</strong> {selectedRequest.designationName}</Typography>
                <Typography><strong>Reporting Manager:</strong> {selectedRequest.reportingManager}</Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Typography variant="h6" gutterBottom>Leave Information</Typography>
                <Typography><strong>Leave Type:</strong> {selectedRequest.leaveType}</Typography>
                <Typography><strong>Start Date:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()}</Typography>
                <Typography><strong>End Date:</strong> {new Date(selectedRequest.endDate).toLocaleDateString()}</Typography>
                <Typography><strong>Total Days:</strong> {selectedRequest.totalDays}</Typography>
                <Typography><strong>Current Balance:</strong> {selectedRequest.leaveBalance} days</Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>Reason</Typography>
                <Typography>{selectedRequest.reason}</Typography>
              </Grid>
              {selectedRequest.approverRemarks && (
                <Grid size={12}>
                  <Typography variant="h6" gutterBottom>Approval Remarks</Typography>
                  <Typography>{selectedRequest.approverRemarks}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRequest(null)}>Close</Button>
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

export default LeaveApprovalForm;
