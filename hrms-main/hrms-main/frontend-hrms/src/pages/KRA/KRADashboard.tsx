import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  UploadFile as UploadIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  CheckCircle as ActiveIcon,
  Edit as DraftIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { mockFinancialYears, KRATemplate } from './mockData';

const StatCard = ({ title, value, icon, color }: any) => (
  <Card sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
      </Box>
      <Box sx={{ 
        backgroundColor: `${color}15`, 
        p: 1.5, 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}>
        {icon}
      </Box>
    </CardContent>
  </Card>
);

const KRADashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filterFY, setFilterFY] = useState(mockFinancialYears[3]);
  const [filterDept, setFilterDept] = useState('');
  const [filterDesig, setFilterDesig] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<KRATemplate[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchMasterData();
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await apiService.getKRAAssignments();
      if (res.success) setAssignments(res.data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const deptRes = await apiService.getDepartments();
      if (deptRes.success) setDepartments(deptRes.data || []);
      const desigRes = await apiService.getDesignations();
      if (desigRes.success) setDesignations(desigRes.data || []);
      const empRes = await apiService.getEmployees(1, 1000);
      if (empRes.success) {
        const empList = Array.isArray(empRes.data)
          ? empRes.data
          : (empRes.data?.content || empRes.data?.employees || []);
        setEmployees(empList);
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await apiService.getKRATemplates();
      if (res.success) setTemplates(res.data);
    } catch (error) {
      console.error('Error fetching templates', error);
    }
  };

  const activeCount = templates.filter(t => t.status === 'Active').length;
  const draftCount = templates.filter(t => t.status === 'Draft').length;
  const assignedEmployeesCount = new Set(assignments.map(a => a.employee_id || a.employeeId)).size;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          KRA Management Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />}
            onClick={() => navigate('/kra/import')}
          >
            Import Excel
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={() => navigate('/kra/export')}
          >
            Export
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/kra/templates/new')}
          >
            Create KRA
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Total Templates" 
            value={templates.length} 
            icon={<AssessmentIcon fontSize="large" />} 
            color="#1976d2" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Active Templates" 
            value={activeCount} 
            icon={<ActiveIcon fontSize="large" />} 
            color="#2e7d32" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Draft Templates" 
            value={draftCount} 
            icon={<DraftIcon fontSize="large" />} 
            color="#ed6c02" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Assigned Employees" 
            value={assignedEmployeesCount} 
            icon={<PeopleIcon fontSize="large" />} 
            color="#9c27b0" 
          />
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom>
          Quick Filters
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Financial Year</InputLabel>
              <Select
                value={filterFY}
                label="Financial Year"
                onChange={(e) => setFilterFY(e.target.value)}
              >
                {mockFinancialYears.map(fy => (
                  <MenuItem key={fy} value={fy}>{fy}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={filterDept}
                label="Department"
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {departments.map((dept: any) => (
                  <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Designation</InputLabel>
              <Select
                value={filterDesig}
                label="Designation"
                onChange={(e) => setFilterDesig(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {designations.map((desig: any) => (
                  <MenuItem key={desig.id} value={desig.name}>{desig.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee</InputLabel>
              <Select
                value={searchQuery}
                label="Employee"
                onChange={(e) => setSearchQuery(e.target.value)}
              >
                <MenuItem value="">All Employees</MenuItem>
                {employees.map((emp: any) => (
                  <MenuItem key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
           <Button variant="text" onClick={() => {
             setFilterFY(mockFinancialYears[3]);
             setFilterDept('');
             setFilterDesig('');
             setFilterStatus('');
             setSearchQuery('');
           }}>Clear Filters</Button>
           <Button variant="contained" onClick={() => navigate('/kra/templates')}>View All Templates</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default KRADashboard;
