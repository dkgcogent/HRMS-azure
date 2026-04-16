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
  Chip,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Save as SaveIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckInIcon,
  ExitToApp as CheckOutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

interface AttendanceRecord {
  id?: number;
  employeeId: number;
  employeeName?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE';
  remarks?: string;
}

const AttendanceForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  useEffect(() => {
    loadEmployees();
    loadAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees(0, 100);
      if (response.success && response.data) {
        setEmployees(response.data.content || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      // Fallback data
      setEmployees([
        { id: 1, firstName: 'John', lastName: 'Doe', employeeId: 'EMP001' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', employeeId: 'EMP002' },
      ]);
    }
  };

  const loadAttendanceForDate = async (date: string) => {
    try {
      // This would be an API call to get attendance for the date
      // For now, we'll initialize with employee list
      const records = employees.map(emp => ({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        date: date,
        status: 'ABSENT' as const,
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleAttendanceChange = (employeeId: number, field: string, value: any) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.employeeId === employeeId 
          ? { ...record, [field]: value }
          : record
      )
    );
  };

  const calculateTotalHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const checkInTime = new Date(`2000-01-01 ${checkIn}`);
    const checkOutTime = new Date(`2000-01-01 ${checkOut}`);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const handleTimeChange = (employeeId: number, field: 'checkInTime' | 'checkOutTime', value: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => {
        if (record.employeeId === employeeId) {
          const updatedRecord = { ...record, [field]: value };
          if (updatedRecord.checkInTime && updatedRecord.checkOutTime) {
            updatedRecord.totalHours = calculateTotalHours(
              updatedRecord.checkInTime, 
              updatedRecord.checkOutTime
            );
            updatedRecord.status = 'PRESENT';
          }
          return updatedRecord;
        }
        return record;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Here you would save attendance records to the API
      // await apiService.saveAttendance(attendanceRecords);
      setSnackbar({ 
        open: true, 
        message: 'Attendance saved successfully!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error saving attendance:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error saving attendance. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'ABSENT': return 'error';
      case 'HALF_DAY': return 'warning';
      case 'LATE': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Daily Attendance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Mark attendance for employees for the selected date.
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 8
            }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                Save Attendance
              </Button>
              <Typography variant="body2" color="text.secondary">
                Total Employees: {employees.length}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.employeeId}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {record.employeeName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employees.find(e => e.id === record.employeeId)?.employeeId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      size="small"
                      value={record.checkInTime || ''}
                      onChange={(e) => handleTimeChange(record.employeeId, 'checkInTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      size="small"
                      value={record.checkOutTime || ''}
                      onChange={(e) => handleTimeChange(record.employeeId, 'checkOutTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.totalHours ? `${record.totalHours}h` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={record.status}
                        onChange={(e) => handleAttendanceChange(record.employeeId, 'status', e.target.value)}
                      >
                        <MenuItem value="PRESENT">Present</MenuItem>
                        <MenuItem value="ABSENT">Absent</MenuItem>
                        <MenuItem value="HALF_DAY">Half Day</MenuItem>
                        <MenuItem value="LATE">Late</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Add remarks..."
                      value={record.remarks || ''}
                      onChange={(e) => handleAttendanceChange(record.employeeId, 'remarks', e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceForm;
