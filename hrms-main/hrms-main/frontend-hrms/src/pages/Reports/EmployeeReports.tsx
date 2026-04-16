// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  People as PeopleIcon,
  Business as DepartmentIcon,
  TrendingUp as TrendingIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface ReportData {
  totalEmployees: number;
  activeEmployees: number;
  departmentWiseCount: { department: string; count: number }[];
  statusWiseCount: { status: string; count: number }[];
  recentJoinings: any[];
}

const EmployeeReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalEmployees: 0,
    activeEmployees: 0,
    departmentWiseCount: [],
    statusWiseCount: [],
    recentJoinings: [],
  });
  const [selectedReport, setSelectedReport] = useState('summary');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setReportData({
        totalEmployees: 150,
        activeEmployees: 142,
        departmentWiseCount: [
          { department: 'IT', count: 45 },
          { department: 'HR', count: 12 },
          { department: 'Finance', count: 18 },
          { department: 'Operations', count: 35 },
          { department: 'Sales', count: 40 },
        ],
        statusWiseCount: [
          { status: 'ACTIVE', count: 142 },
          { status: 'INACTIVE', count: 5 },
          { status: 'TERMINATED', count: 2 },
          { status: 'RESIGNED', count: 1 },
        ],
        recentJoinings: [
          {
            id: 1,
            employeeId: 'EMP00001',
            name: 'John Doe',
            department: 'IT',
            designation: 'Software Engineer',
            joiningDate: '2023-12-01',
          },
          {
            id: 2,
            employeeId: 'EMP00002',
            name: 'Jane Smith',
            department: 'HR',
            designation: 'HR Manager',
            joiningDate: '2023-11-28',
          },
          {
            id: 3,
            employeeId: 'EMP00003',
            name: 'Mike Johnson',
            department: 'Finance',
            designation: 'Accountant',
            joiningDate: '2023-11-25',
          },
        ],
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // Mock export functionality
    alert('Report exported successfully!');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'ACTIVE': 'success',
      'INACTIVE': 'warning',
      'TERMINATED': 'error',
      'RESIGNED': 'default',
    };
    return colors[status] || 'default';
  };

  const renderSummaryReport = () => (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {reportData.totalEmployees}
                  </Typography>
                  <Typography variant="body2">Total Employees</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {reportData.activeEmployees}
                  </Typography>
                  <Typography variant="body2">Active Employees</Typography>
                </Box>
                <TrendingIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {reportData.departmentWiseCount.length}
                  </Typography>
                  <Typography variant="body2">Departments</Typography>
                </Box>
                <DepartmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {Math.round((reportData.activeEmployees / reportData.totalEmployees) * 100)}%
                  </Typography>
                  <Typography variant="body2">Active Rate</Typography>
                </Box>
                <TrendingIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Department-wise Distribution */}
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Department-wise Distribution
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Count</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.departmentWiseCount.map((dept) => (
                    <TableRow key={dept.department}>
                      <TableCell>{dept.department}</TableCell>
                      <TableCell align="right">{dept.count}</TableCell>
                      <TableCell align="right">
                        {Math.round((dept.count / reportData.totalEmployees) * 100)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Status-wise Distribution
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Count</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Badge</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.statusWiseCount.map((status) => (
                    <TableRow key={status.status}>
                      <TableCell>{status.status}</TableCell>
                      <TableCell align="right">{status.count}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={status.status}
                          color={getStatusColor(status.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderRecentJoinings = () => (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Recent Joinings (Last 30 Days)
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Employee ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Joining Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.recentJoinings.map((employee) => (
              <TableRow key={employee.id} hover>
                <TableCell sx={{ fontWeight: 'medium' }}>{employee.employeeId}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.designation}</TableCell>
                <TableCell>{new Date(employee.joiningDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Employee Reports
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={selectedReport}
              label="Report Type"
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <MenuItem value="summary">Summary Report</MenuItem>
              <MenuItem value="recent">Recent Joinings</MenuItem>
              <MenuItem value="department">Department Report</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportReport}
            sx={{ borderRadius: 2 }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {selectedReport === 'summary' && renderSummaryReport()}
      {selectedReport === 'recent' && renderRecentJoinings()}
      {selectedReport === 'department' && renderSummaryReport()}
    </Box>
  );
};

export default EmployeeReports;
