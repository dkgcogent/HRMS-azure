import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  Autocomplete, Snackbar, Alert
} from '@mui/material';
import { Assignment as AssignIcon, Delete as DeleteIcon, Autorenew as ReassignIcon } from '@mui/icons-material';
import { apiService } from '../../services/api';
import { mockFinancialYears, KRATemplate } from './mockData';

const KRAAssignment: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<KRATemplate[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, []);

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

  const fetchData = async () => {
    try {
      const tRes = await apiService.getKRATemplates();
      if (tRes.success) setTemplates(tRes.data);

      const aRes = await apiService.getKRAAssignments();
      if (aRes.success) setAssignments(aRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const [formData, setFormData] = useState({
    financialYear: mockFinancialYears[3],
    department: '',
    designation: '',
    templateId: '',
    employees: [] as string[],
    reportingManager: '',
    effectiveDate: '',
  });

  const handleAssign = async () => {
    if (!formData.templateId || formData.employees.length === 0 || !formData.reportingManager) {
      setSnackbar({ open: true, message: 'Please fill all required fields.', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await apiService.assignKRATemplate({
        templateId: formData.templateId,
        employees: formData.employees,
        reportingManager: formData.reportingManager,
        effectiveDate: formData.effectiveDate
      });
      setSnackbar({ open: true, message: 'KRA Assigned successfully!', severity: 'success' });
      fetchData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to assign KRA.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>Assign KRA Template</Typography>
      
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" mb={2}>Assignment Form</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Financial Year</InputLabel>
              <Select value={formData.financialYear} label="Financial Year" onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}>
                {mockFinancialYears.map(fy => <MenuItem key={fy} value={fy}>{fy}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select value={formData.department} label="Department" onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                <MenuItem value="All">All</MenuItem>
                {departments.map((dept: any) => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Designation</InputLabel>
              <Select value={formData.designation} label="Designation" onChange={(e) => setFormData({ ...formData, designation: e.target.value })}>
                <MenuItem value="All">All</MenuItem>
                {designations.map((desig: any) => <MenuItem key={desig.id} value={desig.name}>{desig.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Template</InputLabel>
              <Select value={formData.templateId} label="Template" onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}>
                {templates.filter(t => t.status === 'Active').map(tpl => (
                  <MenuItem key={tpl.id} value={tpl.id}>{tpl.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              multiple
              size="small"
              options={employees}
              getOptionLabel={(option) => {
                const name = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.name || `Employee ${option.id}`;
                return option.employeeId ? `${name} (${option.employeeId})` : name;
              }}
              onChange={(e, value) => setFormData({ ...formData, employees: value.map(v => String(v.id)) })}
              renderInput={(params) => <TextField {...params} label="Select Employees" placeholder="Employees" />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Reporting Manager</InputLabel>
              <Select value={formData.reportingManager} label="Reporting Manager" onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}>
                {employees.map(emp => {
                  const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || `Employee ${emp.id}`;
                  return <MenuItem key={emp.id} value={String(emp.id)}>{emp.employeeId ? `${name} (${emp.employeeId})` : name}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="date" label="Effective Date" InputLabelProps={{ shrink: true }} size="small" value={formData.effectiveDate} onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button variant="contained" color="primary" onClick={handleAssign} disabled={loading} startIcon={<AssignIcon />}>
            {loading ? 'Assigning...' : 'Assign KRA'}
          </Button>
        </Box>
      </Paper>

      <Typography variant="h6" mb={2}>Recent Assignments</Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Employee Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Template Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Reporting Manager</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Assigned Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment: any) => (
              <TableRow hover key={assignment.id}>
                <TableCell>{assignment.employeeName}</TableCell>
                <TableCell><Chip label={assignment.templateName} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell>{assignment.reportingManager}</TableCell>
                <TableCell>{new Date(assignment.assignedDate).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Reassign">
                    <IconButton size="small" color="secondary"><ReassignIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Assignment">
                    <IconButton size="small" color="error" onClick={async () => {
                      await apiService.removeKRAAssignment(assignment.id);
                      fetchData();
                    }}><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
    </Box>
  );
};

export default KRAAssignment;
