// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface LeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  totalAllotted: number;
  used: number;
  pending: number;
  available: number;
  carryForward: number;
  maxCarryForward: number;
}

interface LeaveTransaction {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  appliedDate: string;
  reason: string;
}

const LeaveBalanceForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveTransaction[]>([]);

  useEffect(() => {
    loadLeaveBalances();
    loadLeaveHistory();
  }, [selectedYear]);

  const loadLeaveBalances = async () => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getLeaveBalances(selectedYear);
      // Mock data
      const mockBalances: LeaveBalance[] = [
        {
          leaveTypeId: 1,
          leaveTypeName: 'Annual Leave',
          totalAllotted: 21,
          used: 8,
          pending: 2,
          available: 11,
          carryForward: 5,
          maxCarryForward: 5,
        },
        {
          leaveTypeId: 2,
          leaveTypeName: 'Sick Leave',
          totalAllotted: 10,
          used: 3,
          pending: 0,
          available: 7,
          carryForward: 0,
          maxCarryForward: 0,
        },
        {
          leaveTypeId: 3,
          leaveTypeName: 'Casual Leave',
          totalAllotted: 12,
          used: 5,
          pending: 1,
          available: 6,
          carryForward: 2,
          maxCarryForward: 3,
        },
        {
          leaveTypeId: 4,
          leaveTypeName: 'Comp Off',
          totalAllotted: 0,
          used: 2,
          pending: 0,
          available: 3,
          carryForward: 5,
          maxCarryForward: 10,
        },
      ];
      setLeaveBalances(mockBalances);
    } catch (error) {
      console.error('Error loading leave balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveHistory = async () => {
    try {
      // In real app: const response = await apiService.getLeaveHistory(selectedYear);
      // Mock data
      const mockHistory: LeaveTransaction[] = [
        {
          id: 1,
          leaveType: 'Annual Leave',
          startDate: '2024-03-15',
          endDate: '2024-03-17',
          days: 3,
          status: 'APPROVED',
          appliedDate: '2024-03-10',
          reason: 'Family vacation',
        },
        {
          id: 2,
          leaveType: 'Sick Leave',
          startDate: '2024-02-20',
          endDate: '2024-02-21',
          days: 2,
          status: 'APPROVED',
          appliedDate: '2024-02-20',
          reason: 'Fever and cold',
        },
        {
          id: 3,
          leaveType: 'Casual Leave',
          startDate: '2024-04-05',
          endDate: '2024-04-05',
          days: 1,
          status: 'PENDING',
          appliedDate: '2024-04-01',
          reason: 'Personal work',
        },
      ];
      setLeaveHistory(mockHistory);
    } catch (error) {
      console.error('Error loading leave history:', error);
    }
  };

  const getProgressColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 80) return 'error';
    if (percentage >= 60) return 'warning';
    return 'success';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const handleYearChange = (event: any) => {
    setSelectedYear(event.target.value);
  };

  const handleExportBalance = () => {
    // Export leave balance to CSV/Excel
    const csvContent = [
      ['Leave Type', 'Total Allotted', 'Used', 'Pending', 'Available', 'Carry Forward'].join(','),
      ...leaveBalances.map(balance => [
        balance.leaveTypeName,
        balance.totalAllotted,
        balance.used,
        balance.pending,
        balance.available,
        balance.carryForward
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave_balance_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalLeaves = leaveBalances.reduce((sum, balance) => sum + balance.totalAllotted, 0);
  const totalUsed = leaveBalances.reduce((sum, balance) => sum + balance.used, 0);
  const totalAvailable = leaveBalances.reduce((sum, balance) => sum + balance.available, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          My Leave Balance
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={handleYearChange}
            >
              <MenuItem value={2024}>2024</MenuItem>
              <MenuItem value={2023}>2023</MenuItem>
              <MenuItem value={2022}>2022</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportBalance}
          >
            Export
          </Button>
        </Box>
      </Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {totalLeaves}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Allotted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error" gutterBottom>
                {totalUsed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {leaveBalances.reduce((sum, balance) => sum + balance.pending, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {totalAvailable}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Leave Balance Details */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon />
          Leave Balance Details
        </Typography>

        <Grid container spacing={3}>
          {leaveBalances.map((balance) => (
            <Grid
              key={balance.leaveTypeId}
              size={{
                xs: 12,
                md: 6
              }}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {balance.leaveTypeName}
                    </Typography>
                    <Chip 
                      label={`${balance.available} Available`} 
                      color="success" 
                      size="small" 
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Used: {balance.used} / {balance.totalAllotted}
                      </Typography>
                      <Typography variant="body2">
                        {Math.round((balance.used / balance.totalAllotted) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(balance.used / balance.totalAllotted) * 100}
                      color={getProgressColor(balance.used, balance.totalAllotted)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">
                        Pending: {balance.pending}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">
                        Carry Forward: {balance.carryForward}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
      {/* Leave History */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Recent Leave History
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Leave Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveHistory.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.leaveType}</TableCell>
                  <TableCell>
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{leave.days}</TableCell>
                  <TableCell>
                    <Chip
                      label={leave.status}
                      color={getStatusColor(leave.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(leave.appliedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {leaveHistory.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No leave history found for {selectedYear}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LeaveBalanceForm;
