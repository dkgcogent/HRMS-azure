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
  Button,
} from '@mui/material';
import { Search as SearchIcon, Schedule as ScheduleIcon, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
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

  const handleExportData = () => {
    if (!filteredAttendance.length) return;
    
    const exportData = filteredAttendance.map(rec => ({
      'Employee Name': `${rec.first_name || ''} ${rec.last_name || ''}`.trim(),
      'Employee ID': rec.employee_id,
      'Date': formatDate(rec.date),
      'Check-In': rec.check_in_time || '-',
      'Check-Out': rec.check_out_time || '-',
      'Attendance Status': rec.status || 'N/A',
      'Work Location': rec.work_location_type || '-',
      'Manual Entry': rec.is_manual_entry ? 'Yes' : 'No',
      'Remarks': rec.remarks || '-'
    }));

    // Export as Excel instead of CSV to better support user workflows
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const processRecords = async (records: any[]) => {
      let successCount = 0;
      let errorCount = 0;
      for (const row of records) {
        const employee_id = row['Employee ID'] || row['employee_id'];
        const dateStr = row['Date'] || row['date'];
        
        let date = dateStr;
        // Handle numeric or string dates robustly for MySQL (YYYY-MM-DD)
        if (typeof dateStr === 'number') {
           const excelEpoch = new Date(1899, 11, 30);
           const parsedDate = new Date(excelEpoch.getTime() + dateStr * 86400000);
           date = parsedDate.toISOString().split('T')[0];
        } else if (typeof dateStr === 'string' && dateStr) {
           const parsed = new Date(dateStr);
           if (!isNaN(parsed.getTime())) {
             const year = parsed.getFullYear();
             const month = String(parsed.getMonth() + 1).padStart(2, '0');
             const day = String(parsed.getDate()).padStart(2, '0');
             date = `${year}-${month}-${day}`;
           }
        }

        const formatTime = (timeVal: any) => {
          if (!timeVal || timeVal === '-') return null;
          if (typeof timeVal === 'number') {
            const totalSeconds = Math.round(timeVal * 86400);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
          }
          if (typeof timeVal === 'string') {
             // If it matches HH:MM:SS, just return
             if (/^\d{2}:\d{2}:\d{2}$/.test(timeVal)) return timeVal;
             // Try to parse using Date
             const d = new Date(`1970-01-01 ${timeVal}`);
             if (!isNaN(d.getTime())) {
               return d.toTimeString().split(' ')[0];
             }
          }
          return timeVal;
        };

        const check_in_time = formatTime(row['Check-In'] || row['check_in_time']);
        const check_out_time = formatTime(row['Check-Out'] || row['check_out_time']);
        const status = row['Attendance Status'] || row['status'] || 'PRESENT';
        const work_location_type = row['Work Location'] || row['work_location_type'] || 'OFFICE';
        const remarks = (row['Remarks'] || row['remarks']) === '-' ? null : (row['Remarks'] || row['remarks']);

        if (employee_id && date) {
           const res = await apiService.attendanceCreateAdmin({
             employee_id,
             date,
             check_in_time,
             check_out_time,
             status,
             work_location_type,
             remarks,
             is_manual_entry: 1
           });
           if (res && res.success === false) {
             console.error('Failed to import record', row, res.message, res.error);
             errorCount++;
           } else {
             successCount++;
           }
        }
      }
      await loadData();
      if (errorCount > 0) {
        alert(`Import completed. Saved ${successCount} records. Failed ${errorCount} records. Check console for details.`);
      } else {
        alert(`Import completed successfully! Saved ${successCount} records.`);
      }
    };

    try {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            try {
              await processRecords(results.data);
            } catch (error) {
              console.error('Error importing attendance:', error);
              alert('Error importing some records. Please check the console.');
            } finally {
              setLoading(false);
              if (event.target) event.target.value = '';
            }
          },
          error: (error: any) => {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file');
            setLoading(false);
            if (event.target) event.target.value = '';
          }
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const records = XLSX.utils.sheet_to_json(worksheet, { raw: false }); // raw: false gets formatted strings for dates
            await processRecords(records);
          } catch (error) {
            console.error('Error parsing Excel:', error);
            alert('Error parsing Excel file');
          } finally {
            setLoading(false);
            if (event.target) event.target.value = '';
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert('Please upload a CSV or Excel (.xlsx) file.');
        setLoading(false);
        if (event.target) event.target.value = '';
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            <Typography variant="h6">Attendance Records</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              style={{ display: 'none' }}
              id="import-csv-input"
              onChange={handleImportData}
            />
            <label htmlFor="import-csv-input">
              <Button component="span" variant="outlined" startIcon={<UploadIcon />} disabled={loading}>
                Import
              </Button>
            </label>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportData} disabled={loading || !filteredAttendance.length}>
              Export
            </Button>
          </Box>
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
                        label={rec.is_manual_entry && !rec.approved_by ? 'Approval Pending' : (rec.status || 'N/A')}
                        color={rec.is_manual_entry && !rec.approved_by ? 'warning' : getStatusColor(rec.status) as any}
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

