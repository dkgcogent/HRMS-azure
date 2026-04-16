
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Snackbar,
  Alert,
  Chip,
  TextField,
} from '@mui/material';
import { apiService } from '../../services/api';

const ManagerDashboard: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [manualPending, setManualPending] = useState<any[]>([]);
  const [regPending, setRegPending] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [att, man, reg] = await Promise.all([
        apiService.attendanceAll(),
        apiService.manualPending(),
        apiService.regularizationPending(),
      ]);
      setAttendance(att?.data || []);
      setManualPending(man?.data || []);
      setRegPending(reg?.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  /**
   * Format date to show only date part (YYYY-MM-DD) without timezone conversion
   * CRITICAL: This function must NOT create new Date objects from date strings
   * because JavaScript interprets "YYYY-MM-DD" as midnight UTC, causing timezone shifts
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    // If already in YYYY-MM-DD format, return as is (most common case from backend)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // If it's an ISO datetime string (contains 'T'), extract just the date part
    // WITHOUT creating a Date object to avoid timezone conversion
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return dateString.split('T')[0];
    }

    // For any other format, try to extract date using IST timezone
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      // Use Intl.DateTimeFormat with IST timezone to get correct date
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const approveManual = async (id: number, approve: boolean) => {
    try {
      setLoading(true);
      const resp = await apiService.manualApprove(id, approve);
      setSnackbar({ open: true, message: resp?.message || 'Action done', severity: resp?.success ? 'success' : 'error' });
      await load();
    } catch {
      setSnackbar({ open: true, message: 'Action failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const approveReg = async (id: number, approve: boolean) => {
    try {
      setLoading(true);
      const resp = await apiService.regularizationApprove(id, approve);
      setSnackbar({ open: true, message: resp?.message || 'Action done', severity: resp?.success ? 'success' : 'error' });
      await load();
    } catch {
      setSnackbar({ open: true, message: 'Action failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        Attendance Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Managers can approve manual attendance, regularizations, and view all records.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Manual Attendance</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>In</TableCell>
                      <TableCell>Out</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manualPending.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.first_name} {r.last_name}</TableCell>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell>{r.check_in_time || '-'}</TableCell>
                        <TableCell>{r.check_out_time || '-'}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => approveManual(r.id, true)} disabled={loading}>Approve</Button>
                          <Button size="small" color="error" onClick={() => approveManual(r.id, false)} disabled={loading}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!manualPending.length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No pending requests</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Regularizations</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Change</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {regPending.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.first_name} {r.last_name}</TableCell>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell>{r.requested_change}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => approveReg(r.id, true)} disabled={loading}>Approve</Button>
                          <Button size="small" color="error" onClick={() => approveReg(r.id, false)} disabled={loading}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!regPending.length && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No pending requests</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>All Attendance Records</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Current Status</TableCell>
                <TableCell>Attendance Status</TableCell>
                <TableCell>Manual</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map((rec) => {
                // Use IST timezone for "today" comparison to match backend
                const today = new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }).format(new Date());
                const isToday = rec.date === today;
                // Use current_status from backend if available, otherwise calculate
                const currentStatus = rec.current_status || (isToday && rec.check_in_time && !rec.check_out_time ? 'CLOCKED_IN' : isToday && rec.check_in_time && rec.check_out_time ? 'CLOCKED_OUT' : 'NOT_CLOCKED_IN');
                const isCurrentlyIn = currentStatus === 'CLOCKED_IN';
                
                return (
                  <TableRow 
                    key={rec.id} 
                    sx={{ 
                      bgcolor: isCurrentlyIn ? 'success.light' : 'inherit',
                      '&:hover': { bgcolor: isCurrentlyIn ? 'success.light' : 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {rec.first_name} {rec.last_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{rec.employee_id || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(rec.date)}
                        {isToday && <Chip label="Today" size="small" color="primary" sx={{ ml: 1 }} />}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {rec.check_in_time ? (
                        <Chip label={rec.check_in_time} size="small" color="success" variant="outlined" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {rec.check_out_time ? (
                        <Chip label={rec.check_out_time} size="small" color="default" variant="outlined" />
                      ) : isCurrentlyIn ? (
                        <Chip label="Still In" size="small" color="warning" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {isCurrentlyIn ? (
                        <Chip label="🟢 Clocked In" size="small" color="success" />
                      ) : currentStatus === 'CLOCKED_OUT' ? (
                        <Chip label="⚪ Clocked Out" size="small" color="default" />
                      ) : (
                        <Chip label="🔴 Not Clocked In" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={rec.status || 'N/A'} 
                        color={rec.status === 'PRESENT' ? 'success' : rec.status === 'LATE' ? 'warning' : rec.status === 'ABSENT' ? 'error' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={rec.is_manual_entry ? 'Yes' : 'No'} 
                        color={rec.is_manual_entry ? 'info' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>{rec.work_location_type || '-'}</TableCell>
                  </TableRow>
                );
              })}
              {!attendance.length && (
                <TableRow>
                  <TableCell colSpan={9} align="center">No records</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default ManagerDashboard;
