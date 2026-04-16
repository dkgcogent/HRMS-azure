
// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import { 
  CheckCircle as CheckInIcon, 
  Schedule as TimeIcon, 
  Logout as LogoutIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MarkAttendanceDialog from '../../components/Attendance/MarkAttendanceDialog';
import ManualPunchDialog from '../../components/Attendance/ManualPunchDialog';
import RegularizationDialog from '../../components/Attendance/RegularizationDialog';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [records, setRecords] = useState<any[]>([]);
  const [regularizations, setRegularizations] = useState<any[]>([]);
  const [dialogs, setDialogs] = useState({ mark: false, manual: false, regularize: false });

  const [manualForm, setManualForm] = useState({
    date: '',
    check_in_time: '',
    check_out_time: '',
    reason: '',
  });

  const [regForm, setRegForm] = useState({
    attendance_id: '',
    requested_change: '',
    reason: '',
  });

  const getTodayIST = () => {
    // Returns YYYY-MM-DD in IST
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  };

  const latestStatus = useMemo(() => {
    if (!records.length) return null;
    const today = getTodayIST();
    const todayRec = records.find(r => r.date && r.date.startsWith(today));
    return todayRec || records[0];
  }, [records]);

  // Determine if employee is currently clocked in
  const isClockedIn = useMemo(() => {
    if (!latestStatus) return false;
    const today = getTodayIST();
    const todayRec = records.find(r => r.date && r.date.startsWith(today));
    return todayRec && todayRec.check_in_time && !todayRec.check_out_time;
  }, [records, latestStatus]);

  const loadData = async () => {
    try {
      console.log('[EmployeeDashboard] Loading attendance data...');
      const [myResp, regResp] = await Promise.all([
        apiService.attendanceMyRecords(),
        apiService.regularizationMyStatus(),
      ]);
      console.log('[EmployeeDashboard] Attendance records response:', myResp);
      console.log('[EmployeeDashboard] Regularization response:', regResp);
      setRecords(myResp?.data || []);
      setRegularizations(regResp?.data || []);
      console.log(`[EmployeeDashboard] Loaded ${myResp?.data?.length || 0} attendance records and ${regResp?.data?.length || 0} regularizations`);
    } catch (e: any) {
      console.error('[EmployeeDashboard] Error loading data:', e);
      setSnackbar({ open: true, message: 'Failed to load attendance data. Please refresh the page.', severity: 'error' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Format date to show only date part (YYYY-MM-DD) without timezone conversion
   * CRITICAL: This function must NOT create new Date objects from date strings
   * because JavaScript interprets "YYYY-MM-DD" as midnight UTC, causing timezone shifts
   *
   * Example of the bug this prevents:
   * - Backend sends: "2025-12-20" (IST date)
   * - new Date("2025-12-20") creates: 2025-12-20T00:00:00.000Z (midnight UTC)
   * - toISOString() returns: "2025-12-20T00:00:00.000Z" which is correct
   * - BUT if displayed in IST, it shows as 2025-12-20 05:30:00 IST
   * - And if the original date was near midnight IST, it could shift to previous day
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
    // This is a fallback for edge cases
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

  const calculateHours = (checkIn: string, checkOut: string) => {
    try {
      const [inHours, inMinutes] = checkIn.split(':').map(Number);
      const [outHours, outMinutes] = checkOut.split(':').map(Number);
      const inTotal = inHours * 60 + inMinutes;
      const outTotal = outHours * 60 + outMinutes;
      const diff = outTotal - inTotal;
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      console.log('[EmployeeDashboard] Clock-out request @client(IST)', getTodayIST(), new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const resp = await apiService.attendanceAutoClockOut({});
      if (resp?.success) {
        setSnackbar({ open: true, message: resp.message || 'Clock-out recorded', severity: 'success' });
        await loadData();
      } else {
        const errorMsg = resp?.message || resp?.error || 'Clock-out failed. Please check console for details.';
        console.error('Clock-out error:', resp);
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Clock-out failed. Please check your connection.';
      console.error('Clock-out exception:', e);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setLoading(true);
      console.log('[EmployeeDashboard] Clock-in/out request @client(IST)', getTodayIST(), new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const resp = await apiService.attendanceMark({});
      if (resp?.success) {
        setSnackbar({ open: true, message: resp.message || (resp.action === 'CLOCK_OUT' ? 'Clock-out recorded' : 'Clock-in recorded'), severity: 'success' });
        await loadData();
      } else {
        const errorMsg = resp?.message || resp?.error || 'Action failed. Please check console for details.';
        console.error('Mark attendance error:', resp);
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Action failed. Please check your connection.';
      console.error('Mark attendance exception:', e);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const resp = await apiService.attendanceManual(manualForm);
      if (resp?.success) {
        setSnackbar({ open: true, message: 'Manual attendance submitted', severity: 'success' });
        setManualForm({ date: '', check_in_time: '', check_out_time: '', reason: '' });
      } else {
        setSnackbar({ open: true, message: resp?.message || 'Submit failed', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Submit failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submitRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...regForm, attendance_id: Number(regForm.attendance_id) };
      const resp = await apiService.regularizationRequest(payload as any);
      if (resp?.success) {
        setSnackbar({ open: true, message: 'Regularization submitted', severity: 'success' });
        setRegForm({ attendance_id: '', requested_change: '', reason: '' });
        await loadData();
      } else {
        setSnackbar({ open: true, message: resp?.message || 'Submit failed', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Submit failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onMarkDialog = async (payload: any) => {
    const resp = await apiService.attendanceMark(payload);
    setSnackbar({ open: true, message: resp?.message || 'Action done', severity: resp?.success ? 'success' : 'error' });
    if (resp?.success) await loadData();
  };

  const onManualDialog = async (payload: any) => {
    const resp = await apiService.attendanceManual(payload);
    setSnackbar({ open: true, message: resp?.message || 'Submitted', severity: resp?.success ? 'success' : 'error' });
    if (resp?.success) await loadData();
  };

  const onRegularizeDialog = async (payload: any) => {
    const resp = await apiService.regularizationRequest(payload);
    setSnackbar({ open: true, message: resp?.message || 'Submitted', severity: resp?.success ? 'success' : 'error' });
    if (resp?.success) await loadData();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        My Attendance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Welcome {user?.name || user?.username}. You can see and manage only your records.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Clock In/Out</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} component="div">
                Status:
                {isClockedIn ? (
                  <Chip label="Clocked In" color="success" size="small" sx={{ ml: 1 }} />
                ) : latestStatus?.check_out_time ? (
                  <Chip label="Clocked Out" color="default" size="small" sx={{ ml: 1 }} />
                ) : (
                  <Chip label="Not Clocked In" color="warning" size="small" sx={{ ml: 1 }} />
                )}
              </Typography>
              {latestStatus && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {latestStatus.check_in_time && `In: ${latestStatus.check_in_time}`}
                  {latestStatus.check_out_time && ` | Out: ${latestStatus.check_out_time}`}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row', width: '100%' }}>
                <Button
                  variant="contained"
                  color={isClockedIn ? "error" : "success"}
                  startIcon={<CheckInIcon />}
                  onClick={handleMarkAttendance}
                  disabled={loading}
                  sx={{ 
                    flex: 1,
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    minHeight: '56px',
                  }}
                >
                  {isClockedIn ? 'Clock Out Now' : 'Clock In Now'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => setDialogs({ ...dialogs, mark: true })}
                  sx={{ 
                    flex: 1,
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    minHeight: '56px',
                  }}
                >
                  Mark Attendance (GPS)
                </Button>
                <Button 
                  variant="contained"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleClockOut}
                  disabled={loading || !isClockedIn}
                  sx={{ 
                    flex: 1,
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    minHeight: '56px',
                  }}
                >
                  Auto Clock Out
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Statistics Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Today's Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {latestStatus?.check_in_time && latestStatus?.check_out_time 
                        ? calculateHours(latestStatus.check_in_time, latestStatus.check_out_time)
                        : '--:--'}
                    </Typography>
                  </Box>
                  <TimeIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      This Month
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {records.filter(r => {
                        // Use string comparison to avoid timezone issues
                        // r.date is now guaranteed to be "YYYY-MM-DD" format string from backend
                        if (!r.date || typeof r.date !== 'string') return false;
                        const [year, month] = r.date.split('-').map(Number);
                        const now = new Date();
                        // IST-aware current month check
                        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        return month === (istNow.getMonth() + 1) && year === istNow.getFullYear();
                      }).length} Days
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Pending Requests
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {regularizations.filter(r => r.status === 'PENDING').length}
                    </Typography>
                  </Box>
                  <NotificationIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Manual Attendance</Typography>
              <Box component="form" onSubmit={submitManual}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Date"
                      type="date"
                      fullWidth
                      value={manualForm.date}
                      onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Check-in"
                      type="time"
                      fullWidth
                      value={manualForm.check_in_time}
                      onChange={(e) => setManualForm({ ...manualForm, check_in_time: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Check-out"
                      type="time"
                      fullWidth
                      value={manualForm.check_out_time}
                      onChange={(e) => setManualForm({ ...manualForm, check_out_time: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{ height: '100%' }}
                      disabled={loading}
                    >
                      Submit
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Reason"
                      fullWidth
                      value={manualForm.reason}
                      onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="outlined" onClick={() => setDialogs({ ...dialogs, manual: true })}>
                      Open Manual Punch Popup
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Request Regularization</Typography>
              <Box component="form" onSubmit={submitRegularization}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Attendance</InputLabel>
                      <Select
                        label="Attendance"
                        value={regForm.attendance_id}
                        onChange={(e) => setRegForm({ ...regForm, attendance_id: e.target.value as any })}
                      >
                        {records.slice(0, 30).map(rec => (
                          <MenuItem key={rec.id} value={String(rec.id)}>
                            {formatDate(rec.date)} {rec.check_in_time || ''}-{rec.check_out_time || ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Requested Change"
                      fullWidth
                      value={regForm.requested_change}
                      onChange={(e) => setRegForm({ ...regForm, requested_change: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Reason"
                      fullWidth
                      value={regForm.reason}
                      onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" disabled={loading}>
                      Submit Regularization
                    </Button>
                    <Button sx={{ ml: 1 }} variant="outlined" onClick={() => setDialogs({ ...dialogs, regularize: true })}>
                      Open Regularization Popup
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>My Regularizations</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Change</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {regularizations.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.requested_change}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.status} color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!regularizations.length && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">No requests</TableCell>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TimeIcon />
          <Typography variant="h6">Recent Attendance</Typography>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>In</TableCell>
                <TableCell>Out</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Manual</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{formatDate(rec.date)}</TableCell>
                  <TableCell>{rec.check_in_time || '-'}</TableCell>
                  <TableCell>{rec.check_out_time || '-'}</TableCell>
                  <TableCell>{rec.status}</TableCell>
                  <TableCell>{rec.is_manual_entry ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
              {!records.length && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No records</TableCell>
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

      <MarkAttendanceDialog
        open={dialogs.mark}
        onClose={() => setDialogs({ ...dialogs, mark: false })}
        onMark={onMarkDialog}
      />
      <ManualPunchDialog
        open={dialogs.manual}
        onClose={() => setDialogs({ ...dialogs, manual: false })}
        onSubmit={onManualDialog}
      />
      <RegularizationDialog
        open={dialogs.regularize}
        onClose={() => setDialogs({ ...dialogs, regularize: false })}
        records={records.slice(0, 60)}
        onSubmit={onRegularizeDialog}
      />
    </Box>
  );
};

export default EmployeeDashboard;
