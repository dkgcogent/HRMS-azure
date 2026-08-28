import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Alert, Snackbar
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, ContentCopy as DuplicateIcon,
  ArrowUpward as MoveUpIcon, ArrowDownward as MoveDownIcon, Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { mockFinancialYears, KRARow } from './mockData';

const generateMonths = (fy: string) => {
  if (!fy) return [];
  const startYear = parseInt(fy.split('-')[0]);
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return months.map((m, index) => {
    const year = index < 9 ? startYear : startYear + 1;
    return `${m}-${year.toString().slice(2)}`;
  });
};

const KRATemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [formData, setFormData] = useState({
    name: '', department: '', designation: '', financialYear: mockFinancialYears[3] || '',
    status: 'Draft'
  });

  const [rows, setRows] = useState<KRARow[]>([
    { id: `row_${Date.now()}_1`, kraName: '', description: '', frequency: 'Yearly', weightage: 0 }
  ]);

  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchMasterData();
    if (isEdit && id) {
      loadTemplate(id);
    }
  }, [id, isEdit]);

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

  const loadTemplate = async (templateId: string) => {
    try {
      const res = await apiService.getKRATemplateById(templateId);
      if (res.success && res.data) {
        setFormData({
          name: res.data.name, department: res.data.department, designation: res.data.designation,
          financialYear: res.data.financialYear, status: res.data.status
        });
        setRows(res.data.items || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const months = generateMonths(formData.financialYear);
  const totalWeightage = rows.reduce((sum, row) => sum + (Number(row.weightage) || 0), 0);

  const handleRowChange = (id: string, field: keyof KRARow, value: string | number) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setRows([...rows, { id: `row_${Date.now()}_${rows.length + 1}`, kraName: '', description: '', frequency: 'Yearly', weightage: 0 }]);
  };

  const duplicateRow = (index: number) => {
    const rowToDuplicate = rows[index];
    const newRows = [...rows];
    newRows.splice(index + 1, 0, { ...rowToDuplicate, id: `row_${Date.now()}_${index + 1}` });
    setRows(newRows);
  };

  const deleteRow = (index: number) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== index));
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === rows.length - 1)) return;
    const newRows = [...rows];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newRows[index], newRows[swapIndex]] = [newRows[swapIndex], newRows[index]];
    setRows(newRows);
  };

  const handleSave = async () => {
    if (totalWeightage !== 100) {
      setSnackbar({ open: true, message: 'Total Weightage must be exactly 100%.', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: id || `KRA-${Date.now()}`,
        ...formData,
        items: rows.map((r, index) => ({
          ...r,
          id: (r.id && !r.id.startsWith('row_')) ? r.id : `ITEM-${Date.now()}-${index + 1}`
        }))
      };
      let res;
      if (isEdit && id) {
        res = await apiService.updateKRATemplate(id, payload);
      } else {
        res = await apiService.createKRATemplate(payload);
      }
      if (res && res.success === false) {
        setSnackbar({ open: true, message: res.message || 'Error saving template', severity: 'error' });
        return;
      }
      setSnackbar({ open: true, message: 'Template saved successfully!', severity: 'success' });
      setTimeout(() => navigate('/kra/templates'), 1000);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.message || 'Error saving template';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {isEdit ? 'Edit KRA' : 'Create KRA'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/kra/templates')} disabled={loading}>Cancel</Button>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save KRA'}
          </Button>
        </Box>
      </Box>

      {/* Form Metadata Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 1 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee</InputLabel>
              <Select
                value={formData.name}
                label="Employee"
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  const selectedEmp = employees.find((emp: any) => {
                    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || `Employee ${emp.id}`;
                    return fullName === selectedVal;
                  });
                  setFormData(prev => ({
                    ...prev,
                    name: selectedVal,
                    department: selectedEmp?.departmentName || selectedEmp?.department || prev.department,
                    designation: selectedEmp?.designationName || selectedEmp?.designation || prev.designation,
                  }));
                }}
              >
                {employees.map((emp: any) => {
                  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || `Employee ${emp.id}`;
                  const label = emp.employeeId ? `${fullName} (${emp.employeeId})` : fullName;
                  return (
                    <MenuItem key={emp.id} value={fullName}>
                      {label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Financial Year</InputLabel>
              <Select value={formData.financialYear} label="Financial Year" onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}>
                {mockFinancialYears.map(fy => <MenuItem key={fy} value={fy}>{fy}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select value={formData.department} label="Department" disabled onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                {departments.map((dept: any) => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Designation</InputLabel>
              <Select value={formData.designation} label="Designation" disabled onChange={(e) => setFormData({ ...formData, designation: e.target.value })}>
                {designations.map((desig: any) => <MenuItem key={desig.id} value={desig.name}>{desig.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* KRA Dynamic Table Section */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 2, borderRadius: 2 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6">KRA Details</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addRow} size="small">Add Row</Button>
        </Box>
        <TableContainer sx={{ maxHeight: 600, width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
            <TableHead>
              {/* Header Group Row */}
              <TableRow>
                <TableCell colSpan={6} sx={{ backgroundColor: '#fff2cc', borderRight: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold' }}>To be filled by Admin</TableCell>
                {months.map(m => (
                  <TableCell key={m} colSpan={2} sx={{ backgroundColor: '#e1f5fe', borderRight: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold' }}>{m}</TableCell>
                ))}
              </TableRow>
              {/* Actual Headers Row */}
              <TableRow>
                <TableCell sx={{ backgroundColor: '#fff2cc', width: 50, borderRight: '1px solid #e0e0e0' }}>S.No</TableCell>
                <TableCell sx={{ backgroundColor: '#fff2cc', minWidth: 200, borderRight: '1px solid #e0e0e0' }}>KRA</TableCell>
                <TableCell sx={{ backgroundColor: '#fff2cc', minWidth: 300, borderRight: '1px solid #e0e0e0' }}>Description</TableCell>
                <TableCell sx={{ backgroundColor: '#fff2cc', minWidth: 120, borderRight: '1px solid #e0e0e0' }}>Frequency</TableCell>
                <TableCell sx={{ backgroundColor: '#fff2cc', minWidth: 100, borderRight: '1px solid #e0e0e0' }}>Weightage</TableCell>
                <TableCell sx={{ backgroundColor: '#fff2cc', minWidth: 140, borderRight: '1px solid #e0e0e0' }}>Actions</TableCell>
                {months.map(m => (
                  <React.Fragment key={m}>
                    <TableCell sx={{ backgroundColor: '#e1f5fe', width: 60 }}>Emp</TableCell>
                    <TableCell sx={{ backgroundColor: '#ffe0b2', width: 60, borderRight: '1px solid #e0e0e0' }}>RM</TableCell>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0' }}>{index + 1}</TableCell>
                  <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0' }}>
                    <TextField fullWidth size="small" variant="standard" value={row.kraName} onChange={(e) => handleRowChange(row.id, 'kraName', e.target.value)} />
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0' }}>
                    <TextField fullWidth size="small" variant="standard" multiline maxRows={3} value={row.description} onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} />
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0' }}>
                    <Select fullWidth size="small" variant="standard" value={row.frequency || 'Yearly'} onChange={(e) => handleRowChange(row.id, 'frequency', e.target.value)}>
                      {['Yearly'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0' }}>
                    <TextField fullWidth size="small" type="number" variant="standard" value={row.weightage} onChange={(e) => handleRowChange(row.id, 'weightage', Number(e.target.value))} />
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    <Tooltip title="Duplicate"><IconButton size="small" onClick={() => duplicateRow(index)}><DuplicateIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Move Up"><IconButton size="small" onClick={() => moveRow(index, 'up')} disabled={index === 0}><MoveUpIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Move Down"><IconButton size="small" onClick={() => moveRow(index, 'down')} disabled={index === rows.length - 1}><MoveDownIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => deleteRow(index)} color="error" disabled={rows.length === 1}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                  {months.map(m => (
                    <React.Fragment key={m}>
                      <TableCell sx={{ backgroundColor: '#e1f5fe' }}></TableCell>
                      <TableCell sx={{ backgroundColor: '#ffe0b2', borderRight: '1px solid #e0e0e0' }}></TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              ))}
              {/* Footer Total Weightage */}
              <TableRow>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total Weightage:</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: totalWeightage !== 100 ? 'red' : 'green' }}>
                  {totalWeightage}%
                </TableCell>
                <TableCell colSpan={1 + (months.length * 2)}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {totalWeightage !== 100 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          The Total Weightage currently is {totalWeightage}%. It must be exactly 100% to save the template.
        </Alert>
      )}


      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KRATemplateForm;
