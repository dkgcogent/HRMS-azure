import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Employee, apiService, Department } from '../../services/api';

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const loadEmployees = useCallback(async () => {
    try {
      const filters: any = {};
      if (searchTerm) filters.name = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (departmentFilter) filters.departmentId = departmentFilter;

      const response = await apiService.searchEmployees(filters, page, rowsPerPage);
      if (response.success && response.data) {
        setEmployees(response.data.content);
        setTotalCount(response.data.totalElements);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, departmentFilter]);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await apiService.getDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, [loadEmployees, loadDepartments]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (id: number) => {
    navigate(`/employees/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await apiService.deleteEmployee(id);
        loadEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Mobile',
      'Department',
      'Designation',
      'Status',
      'Joining Date'
    ];

    const csvData = employees.map(emp => [
      emp.employeeId,
      `${emp.firstName} ${emp.middleName ? `${emp.middleName} ` : ''}${emp.lastName}`,
      emp.email,
      emp.mobile,
      emp.departmentName,
      emp.designationName,
      emp.status,
      emp.joiningDate
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getInitials = (firstName: string | undefined, lastName: string | undefined) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Employee Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToCSV} sx={{ borderRadius: 2 }}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/employees/new')} sx={{ borderRadius: 2 }}>
            Add Employee
          </Button>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
            <TextField
              fullWidth
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label" shrink={!!statusFilter || true}>Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                renderValue={(selected: any) => {
                  if (!selected || selected === '') {
                    return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>All Status</span>;
                  }
                  const statusLabels: { [key: string]: string } = {
                    'ACTIVE': 'Active',
                    'INACTIVE': 'Inactive',
                    'TERMINATED': 'Terminated',
                    'RESIGNED': 'Resigned',
                  };
                  return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{statusLabels[selected] || selected}</span>;
                }}
                sx={{
                  '& .MuiSelect-select': {
                    paddingLeft: '20px !important',
                    paddingRight: '40px !important',
                    paddingTop: '14px !important',
                    paddingBottom: '14px !important',
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    width: '100% !important',
                    boxSizing: 'border-box',
                    '@media (max-width:600px)': {
                      paddingLeft: '16px !important',
                      paddingRight: '32px !important',
                      paddingTop: '10px !important',
                      paddingBottom: '10px !important',
                    },
                  },
                  '& .MuiSelect-select > span': {
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    maxWidth: 'none !important',
                    width: 'auto !important',
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="TERMINATED">Terminated</MenuItem>
                <MenuItem value="RESIGNED">Resigned</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel id="department-filter-label" shrink={!!departmentFilter || true}>Department</InputLabel>
              <Select
                labelId="department-filter-label"
                value={departmentFilter}
                label="Department"
                onChange={(e) => setDepartmentFilter(e.target.value)}
                displayEmpty
                renderValue={(selected: any) => {
                  if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                    return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>All Departments</span>;
                  }
                  const dept = departments.find(d => d.id === selected);
                  return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{dept?.name || String(selected)}</span>;
                }}
                sx={{
                  '& .MuiSelect-select': {
                    paddingLeft: '20px !important',
                    paddingRight: '40px !important',
                    paddingTop: '14px !important',
                    paddingBottom: '14px !important',
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    width: '100% !important',
                    boxSizing: 'border-box',
                    '@media (max-width:600px)': {
                      paddingLeft: '16px !important',
                      paddingRight: '32px !important',
                      paddingTop: '10px !important',
                      paddingBottom: '10px !important',
                    },
                  },
                  '& .MuiSelect-select > span': {
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    maxWidth: 'none !important',
                    width: 'auto !important',
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                {departments.map(dept => <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '0 0 auto' }}>
            <Button variant="outlined" startIcon={<FilterIcon />} onClick={loadEmployees}>
              Filter
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Employee</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joining Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(employee.firstName, employee.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}{employee.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{employee.employeeId}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{employee.mobile}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{employee.departmentName}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{employee.designationName}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(employee.status)}
                      color={getStatusColor(employee.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell><Typography variant="body2">{new Date(employee.joiningDate).toLocaleDateString()}</Typography></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(employee.id!)} color="primary"><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(employee.id!)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default EmployeeList;
