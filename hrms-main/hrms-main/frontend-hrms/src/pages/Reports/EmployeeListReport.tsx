import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  department: { name: string };
  designation: { name: string };
  manpowerType: { name: string };
  joiningDate: string;
  status: string;
  isActive: boolean;
}

interface FilterState {
  department: string;
  designation: string;
  manpowerType: string;
  status: string;
  search: string;
}

const EmployeeListReport: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [manpowerTypes, setManpowerTypes] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [filters, setFilters] = useState<FilterState>({
    department: '',
    designation: '',
    manpowerType: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [employees, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesRes, departmentsRes, designationsRes, manpowerTypesRes] = await Promise.all([
        apiService.getEmployees(),
        apiService.getDepartments(),
        apiService.getDesignations(),
        apiService.getManpowerTypes(),
      ]);

      const employeeData = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data?.content || []);
      setEmployees(employeeData as Employee[]);
      setDepartments(departmentsRes.data || []);
      setDesignations(designationsRes.data || []);
      setManpowerTypes(manpowerTypesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    if (filters.department) {
      filtered = filtered.filter(emp => emp.department?.name === filters.department);
    }
    if (filters.designation) {
      filtered = filtered.filter(emp => emp.designation?.name === filters.designation);
    }
    if (filters.manpowerType) {
      filtered = filtered.filter(emp => emp.manpowerType?.name === filters.manpowerType);
    }
    if (filters.status) {
      filtered = filtered.filter(emp => emp.status === filters.status);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.employeeId.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEmployees(filtered);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      designation: '',
      manpowerType: '',
      status: '',
      search: '',
    });
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // This would implement actual export functionality
    setSnackbar({
      open: true,
      message: `${format.toUpperCase()} export started. Download will begin shortly.`,
      severity: 'success'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'default';
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'TERMINATED': return 'error';
      case 'RESIGNED': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string | undefined | null) => {
    if (!status) return 'Active';
    const labels: { [key: string]: string } = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'TERMINATED': 'Terminated',
      'RESIGNED': 'Resigned',
    };
    return labels[status.toUpperCase()] || status;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/reports')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <PeopleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Employee List Report
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('excel')}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {filteredEmployees.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Employees
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
              {filteredEmployees.filter(emp => emp.status === 'ACTIVE').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Employees
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
              {new Set(filteredEmployees.map(emp => emp.department?.name)).size}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Departments
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
              {new Set(filteredEmployees.map(emp => emp.designation?.name)).size}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Designations
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FilterIcon />
          <Typography variant="h6">Filters</Typography>
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            disabled={Object.values(filters).every(v => !v)}
          >
            Clear All
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Name, ID, Email..."
          />
          <FormControl fullWidth size="small">
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department}
              label="Department"
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.name}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Designation</InputLabel>
            <Select
              value={filters.designation}
              label="Designation"
              onChange={(e) => handleFilterChange('designation', e.target.value)}
            >
              <MenuItem value="">All Designations</MenuItem>
              {designations.map((desig) => (
                <MenuItem key={desig.id} value={desig.name}>
                  {desig.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Manpower Type</InputLabel>
            <Select
              value={filters.manpowerType}
              label="Manpower Type"
              onChange={(e) => handleFilterChange('manpowerType', e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {manpowerTypes.map((type) => (
                <MenuItem key={type.id} value={type.name}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="TERMINATED">Terminated</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Employee Table */}
      <Paper elevation={2}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Joining Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No employees found matching the current filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {employee.employeeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {employee.firstName} {employee.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.mobile}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.department?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.designation?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.manpowerType?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(employee.status)}
                        color={getStatusColor(employee.status) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeListReport;
