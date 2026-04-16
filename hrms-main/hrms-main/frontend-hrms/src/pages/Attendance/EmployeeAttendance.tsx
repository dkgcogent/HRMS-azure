import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Grid as MuiGrid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  GridProps,
} from '@mui/material';
import { Search as SearchIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { apiService } from '../../services/api';

// Create a Grid component that always includes component="div" for Grid items
const Grid = (props: GridProps & { 
  item?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
}) => {
  if (props.item) {
    return <MuiGrid component="div" {...props} />;
  }
  return <MuiGrid {...props} />;
};

const EmployeeAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const attResp = await apiService.attendanceAll();
      setAttendance(attResp?.data || []);
      setFilteredAttendance(attResp?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  useEffect(() => {
    let filtered = attendance;

    // Filter by employee
    if (selectedEmployee) {
      filtered = filtered.filter((rec) => rec.employee_id === Number(selectedEmployee));
    }

    // Filter by search term (employee name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (rec) =>
          `${rec.first_name || ''} ${rec.last_name || ''}`.toLowerCase().includes(searchLower) ||
          rec.employee_id?.toString().includes(searchTerm)
      );
    }

    setFilteredAttendance(filtered);
  }, [searchTerm, selectedEmployee, attendance]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'LATE':
        return 'warning';
      case 'ABSENT':
        return 'error';
      case 'HALF_DAY':
        return 'info';
      case 'WORK_FROM_HOME':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get unique employees from attendance records
  const uniqueEmployees = Array.from(
    new Map(
      attendance.map((rec) => [
        rec.employee_id,
        { id: rec.employee_id, name: `${rec.first_name || ''} ${rec.last_name || ''}`.trim() },
      ])
    ).values()
  );

  // Calculate statistics
  const stats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter((r) => r.status === 'PRESENT').length,
    absent: filteredAttendance.filter((r) => r.status === 'ABSENT').length,
    late: filteredAttendance.filter((r) => r.status === 'LATE').length,
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        Employee Attendance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View and manage employee attendance records with detailed information.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Records
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Present
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {stats.present}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Absent
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {stats.absent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Late
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {stats.late}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Employee</InputLabel>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                label="Filter by Employee"
              >
                <MenuItem value="">All Employees</MenuItem>
                {uniqueEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={String(emp.id)}>
                    {emp.name || `Employee ${emp.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Attendance Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ScheduleIcon />
          <Typography variant="h6">Attendance Records</Typography>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Check-In</TableCell>
                <TableCell>Check-Out</TableCell>
                <TableCell>Current Status</TableCell>
                <TableCell>Attendance Status</TableCell>
                <TableCell>Work Location</TableCell>
                <TableCell>Manual Entry</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendance.map((rec) => {
                // Use IST timezone for "today" comparison to match backend
                const today = new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }).format(new Date());
                const isToday = rec.date === today;
                const currentStatus = rec.current_status || (isToday && rec.check_in_time && !rec.check_out_time ? 'CLOCKED_IN' : isToday && rec.check_in_time && rec.check_out_time ? 'CLOCKED_OUT' : 'NOT_CLOCKED_IN');
                const isCurrentlyIn = currentStatus === 'CLOCKED_IN';
                
                return (
                  <TableRow 
                    key={rec.id} 
                    hover
                    sx={{ 
                      bgcolor: isCurrentlyIn ? 'success.light' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {rec.first_name} {rec.last_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{rec.employee_id}</TableCell>
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
                        <Chip label="🔴 Not In" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={rec.status || 'N/A'}
                        color={getStatusColor(rec.status) as any}
                      />
                    </TableCell>
                    <TableCell>{rec.work_location_type || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={rec.is_manual_entry ? 'Yes' : 'No'}
                        color={rec.is_manual_entry ? 'info' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{rec.remarks || '-'}</TableCell>
                  </TableRow>
                );
              })}
              {!filteredAttendance.length && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    {loading ? 'Loading...' : 'No attendance records found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default EmployeeAttendance;

