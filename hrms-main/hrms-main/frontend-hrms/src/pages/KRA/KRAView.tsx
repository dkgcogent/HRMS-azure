import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Alert, Snackbar, CircularProgress, Card, CardContent, Chip, IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Refresh as RefreshIcon, Assessment as KraIcon, GetApp as GetAppIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import * as XLSX from 'xlsx';

import { useAuth } from '../../contexts/AuthContext';

const generateMonths = (fy: string) => {
  if (!fy) return [];
  const startYear = parseInt(fy.split('-')[0]);
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return months.map((m, index) => {
    const year = index < 9 ? startYear : startYear + 1;
    return `${m}-${year.toString().slice(2)}`;
  });
};

const getCurrentMonthTag = () => {
  const date = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(2);
  return `${month}-${year}`;
};

const KRAView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [assignedEmployee, setAssignedEmployee] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  const [scores, setScores] = useState<Record<string, { empScore: string | number; rmScore: string | number }>>({});
  const [savedScoresMap, setSavedScoresMap] = useState<Record<string, { empScore: string | number; rmScore: string | number }>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const financialYear = template?.financialYear || '2026-2027';
  const months = useMemo(() => generateMonths(financialYear), [financialYear]);
  const currentMonthTag = useMemo(() => getCurrentMonthTag(), []);

  // 1. Fetch Template & Assigned Employee
  useEffect(() => {
    const loadTemplateData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [tmplRes, empRes, assignRes] = await Promise.all([
          apiService.getKRATemplateById(id),
          apiService.getEmployees(1, 1000),
          apiService.getKRAAssignments()
        ]);

        let tmplData = null;
        if (tmplRes?.success && tmplRes.data) {
          tmplData = tmplRes.data;
          setTemplate(tmplData);
          setItems(tmplData.items || []);
        }

        let empList: any[] = [];
        if (empRes?.success) {
          empList = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.content || empRes.data?.employees || []);
        }

        let assignments: any[] = [];
        if (assignRes?.success && Array.isArray(assignRes.data)) {
          assignments = assignRes.data;
        }

        // Intelligently find assigned employee:
        let matchedEmp: any = null;

        // A. Direct Assignment match in kra_assignments
        const assign = assignments.find((a: any) => String(a.templateId) === String(id));
        if (assign && assign.employeeId) {
          const targetId = String(assign.employeeId);
          matchedEmp = empList.find(
            (e) => String(e.id) === targetId ||
                   String(e.employeeId || e.employee_id || '').toLowerCase() === targetId.toLowerCase()
          );
        }

        // B. Match by Template Name (e.g. "employee1 Demo" -> matches "Employee One" or "employee1")
        if (!matchedEmp && tmplData?.name) {
          const tName = tmplData.name.toLowerCase();
          matchedEmp = empList.find((e) => {
            const fullName = `${e.firstName || ''} ${e.lastName || ''}`.trim().toLowerCase();
            const code = String(e.employeeId || e.employee_id || '').toLowerCase();
            const eName = (e.name || '').toLowerCase();
            return (fullName && tName.includes(fullName)) ||
                   (code && tName.includes(code)) ||
                   (eName && (tName.includes(eName) || eName.includes(tName.replace('demo', '').trim())));
          });
        }

        // C. Match by Logged In User profile
        if (!matchedEmp && user) {
          const userEmpId = String(user.employeeId || (user as any).id || localStorage.getItem('employeeId') || '');
          matchedEmp = empList.find(
            (e) => String(e.id) === userEmpId ||
                   String(e.employeeId || e.employee_id || '') === userEmpId ||
                   (`${e.firstName || ''} ${e.lastName || ''}`.trim().toLowerCase() === (user.name || '').toLowerCase())
          );
        }

        // D. Fallback to first employee if no match
        if (!matchedEmp && empList.length > 0) {
          matchedEmp = empList[0];
        }

        if (matchedEmp) {
          setAssignedEmployee(matchedEmp);
          setSelectedEmployeeId(String(matchedEmp.id || matchedEmp.employeeId || matchedEmp.employee_id));
        }
      } catch (err) {
        console.error('Error loading template details:', err);
        setSnackbar({ open: true, message: 'Failed to load template details.', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadTemplateData();
  }, [id, user]);

  // 2. Load Scores for assigned employee
  const loadEmployeeScores = useCallback(async () => {
    if (!selectedEmployeeId || !template) return;
    try {
      const res = await apiService.getMyKRA(selectedEmployeeId, financialYear);
      if (res?.success && res.data) {
        const loadedScores: Record<string, { empScore: string | number; rmScore: string | number }> = {};
        const backendScores = res.data.scores || {};

        (items.length > 0 ? items : res.data.items || []).forEach((item: any) => {
          months.forEach((m) => {
            const key = `${item.id}_${m}`;
            const existing = backendScores[key];
            loadedScores[key] = {
              empScore: existing?.empScore !== null && existing?.empScore !== undefined ? existing.empScore : '',
              rmScore: existing?.rmScore !== null && existing?.rmScore !== undefined ? existing.rmScore : '',
            };
          });
        });
        setScores(loadedScores);
        setSavedScoresMap(JSON.parse(JSON.stringify(loadedScores)));
      }
    } catch (err) {
      console.error('Error loading employee scores:', err);
    }
  }, [selectedEmployeeId, template, financialYear, items, months]);

  useEffect(() => {
    if (selectedEmployeeId && template) {
      loadEmployeeScores();
    }
  }, [selectedEmployeeId, template, loadEmployeeScores]);

  const handleScoreChange = (itemId: string, month: string, field: 'empScore' | 'rmScore', val: string) => {
    const key = `${itemId}_${month}`;
    setScores((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }));
  };

  const handleSaveRM = async () => {
    if (!selectedEmployeeId) return;
    setSaving(true);
    try {
      const scoreList: any[] = [];
      items.forEach((item) => {
        months.forEach((m) => {
          const key = `${item.id}_${m}`;
          const sc = scores[key];
          if (sc && (sc.empScore !== '' || sc.rmScore !== '')) {
            scoreList.push({
              itemId: item.id,
              month: m,
              empScore: sc.empScore,
              rmScore: sc.rmScore,
            });
          }
        });
      });

      await apiService.saveMyKRAScores({
        employeeId: selectedEmployeeId,
        financialYear,
        templateId: id,
        scores: scoreList,
      });

      setSavedScoresMap(JSON.parse(JSON.stringify(scores)));
      setSnackbar({ open: true, message: 'RM scores saved successfully! Entry is now locked.', severity: 'success' });
    } catch (err) {
      console.error('Error saving RM scores:', err);
      setSnackbar({ open: true, message: 'Error saving scores.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Helper to check if RM score for a month is already saved
  const isRmSaved = useCallback((month: string) => {
    if (items.length === 0) return false;
    return items.every((item) => {
      const key = `${item.id}_${month}`;
      const saved = savedScoresMap[key];
      return saved && saved.rmScore !== '' && saved.rmScore !== null && saved.rmScore !== undefined;
    });
  }, [items, savedScoresMap]);

  // Calculate percentage achievement score for a month: (Sum of Scores / Sum of Weightages) * 100
  const calculateMonthlyTotal = useCallback((month: string, type: 'empScore' | 'rmScore') => {
    let totalScores = 0;
    let totalWeightageSum = 0;
    let hasValue = false;

    items.forEach((item) => {
      const key = `${item.id}_${month}`;
      const sc = scores[key];
      const val = sc ? (type === 'empScore' ? sc.empScore : sc.rmScore) : '';

      if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) {
        hasValue = true;
        totalScores += Number(val);
        totalWeightageSum += Number(item.weightage) || 0;
      }
    });

    if (!hasValue || totalWeightageSum === 0) return '-';
    const percentage = (totalScores / totalWeightageSum) * 100;
    return `${percentage.toFixed(2)}%`;
  }, [items, scores]);

  const totalWeightage = items.reduce((sum, item) => sum + (Number(item.weightage) || 0), 0);
  const empDisplayName = assignedEmployee
    ? `${assignedEmployee.firstName || ''} ${assignedEmployee.lastName || ''}`.trim() || assignedEmployee.name
    : `Employee ${selectedEmployeeId || ''}`;
  const isRmCurrentSaved = isRmSaved(currentMonthTag);

  const handleExportToExcel = () => {
    if (items.length === 0) {
      setSnackbar({ open: true, message: 'No data to export', severity: 'error' });
      return;
    }

    const exportData = items.map((item, index) => {
      const rowData: any = {
        'S.No': index + 1,
        'KRA Name': item.name || '',
        'Description': item.description || '',
        'Frequency': item.frequency || '',
        'Weightage': item.weightage || 0,
      };

      months.forEach((m) => {
        const key = `${item.id}_${m}`;
        const sc = scores[key];
        rowData[`${m} - Emp`] = sc?.empScore !== undefined && sc?.empScore !== '' ? sc.empScore : '-';
        rowData[`${m} - RM`] = sc?.rmScore !== undefined && sc?.rmScore !== '' ? sc.rmScore : '-';
      });

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KRA Submissions');
    XLSX.writeFile(workbook, `KRA_Submissions_${empDisplayName.replace(/ /g, '_')}_${financialYear}.xlsx`);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Back & Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/kra/templates')} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <KraIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              View KRA Template & Employee Submissions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Inspect template items and employee performance scores
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="secondary" startIcon={<GetAppIcon />} onClick={handleExportToExcel} disabled={loading || items.length === 0}>
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadEmployeeScores} disabled={loading || saving}>
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveRM}
            disabled={loading || saving || !template || isRmCurrentSaved}
          >
            {saving ? 'Saving...' : isRmCurrentSaved ? 'RM Scores Saved' : 'Save RM Scores'}
          </Button>
        </Box>
      </Box>

      {/* Template & Assigned Employee Header Card */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : !template ? (
        <Alert severity="error">Template not found.</Alert>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 1 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Assigned Employee
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      {empDisplayName}
                    </Typography>
                    {assignedEmployee?.employeeId && (
                      <Typography variant="caption" color="text.secondary">
                        ID: {assignedEmployee.employeeId}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <Card variant="outlined" sx={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Template Name</Typography>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">{template.name}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Department / Desig</Typography>
                        <Typography variant="subtitle2" fontWeight="bold">{template.department || 'All'} - {template.designation || 'All'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Financial Year</Typography>
                        <Typography variant="subtitle2" fontWeight="bold">{template.financialYear}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
                        <Chip label={template.status} size="small" color={template.status === 'Active' ? 'success' : 'warning'} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Table displaying template items and employee scores */}
          <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 2, borderRadius: 2 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6">Performance Entries for: {empDisplayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Employee filled scores are shown under <strong>Emp</strong>. RM scores can be edited under <strong>RM</strong>.
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 600, width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1400 }}>
                <TableHead>
                  {/* Header Group Row */}
                  <TableRow>
                    <TableCell colSpan={5} sx={{ backgroundColor: '#fff2cc', borderRight: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold' }}>
                      KRA Template Details
                    </TableCell>
                    {months.map((m) => {
                      const isCurrent = m === currentMonthTag;
                      const saved = isRmSaved(m);
                      return (
                        <TableCell
                          key={m}
                          colSpan={2}
                          sx={{
                            backgroundColor: isCurrent ? (saved ? '#d1c4e9' : '#c8e6c9') : '#e1f5fe',
                            borderRight: '1px solid #e0e0e0',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: isCurrent ? (saved ? '#4a148c' : '#1b5e20') : 'inherit'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {m}
                            {isCurrent && (
                              <Chip
                                label={saved ? "Submitted" : "Active"}
                                size="small"
                                color={saved ? "secondary" : "success"}
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Sub Headers */}
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#fff2cc', width: 50, borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>S.No</TableCell>
                    <TableCell sx={{ backgroundColor: '#fff2cc', minWidth: 180, borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>KRA Name</TableCell>
                    <TableCell sx={{ backgroundColor: '#fff2cc', minWidth: 250, borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ backgroundColor: '#fff2cc', width: 100, borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>Frequency</TableCell>
                    <TableCell sx={{ backgroundColor: '#fff2cc', width: 90, borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>Weightage</TableCell>
                    {months.map((m) => {
                      const isCurrent = m === currentMonthTag;
                      return (
                        <React.Fragment key={m}>
                          <TableCell sx={{ backgroundColor: isCurrent ? '#a5d6a7' : '#bbdefb', width: 65, textAlign: 'center', fontWeight: 'bold' }}>Emp</TableCell>
                          <TableCell sx={{ backgroundColor: '#ffe0b2', width: 65, textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>RM</TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id || index} hover>
                      <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>{index + 1}</TableCell>
                      <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>{item.kraName}</TableCell>
                      <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0', fontSize: '0.85rem' }}>{item.description}</TableCell>
                      <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0' }}>{item.frequency || 'Yearly'}</TableCell>
                      <TableCell sx={{ backgroundColor: '#fffde7', borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>{item.weightage}%</TableCell>
                      
                      {months.map((m) => {
                        const key = `${item.id}_${m}`;
                        const sc = scores[key] || { empScore: '', rmScore: '' };
                        const isCurrent = m === currentMonthTag;
                        const rmSaved = isRmSaved(m);
                        const isRmEditable = isCurrent && !rmSaved;

                        return (
                          <React.Fragment key={m}>
                            {/* Emp Score Column - Filled by Employee (Read Only for Admin View) */}
                            <TableCell sx={{ backgroundColor: isCurrent ? '#e8f5e9' : '#e3f2fd', p: 0.5, textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: sc.empScore !== '' ? 'success.dark' : 'text.disabled' }}>
                                {sc.empScore !== '' ? sc.empScore : '-'}
                              </Typography>
                            </TableCell>

                            {/* RM Score Column - Editable ONLY for active month before saving; locked read-only for past or saved months */}
                            <TableCell sx={{ backgroundColor: '#fff3e0', borderRight: '1px solid #e0e0e0', p: 0.5, textAlign: 'center' }}>
                              {isRmEditable ? (
                                <TextField
                                  fullWidth
                                  type="number"
                                  size="small"
                                  variant="outlined"
                                  value={sc.rmScore}
                                  onChange={(e) => handleScoreChange(item.id, m, 'rmScore', e.target.value)}
                                  inputProps={{ min: 0, max: 100, style: { textAlign: 'center', padding: '4px', fontSize: '0.85rem', fontWeight: 600 } }}
                                  sx={{ 
                                    bgcolor: 'white', 
                                    borderRadius: 1,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#e65100',
                                      borderWidth: 2
                                    }
                                  }}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 600, color: sc.rmScore !== '' ? '#e65100' : 'text.disabled' }}>
                                  {sc.rmScore !== '' ? sc.rmScore : '-'}
                                </Typography>
                              )}
                            </TableCell>
                          </React.Fragment>
                        );
                      })}
                    </TableRow>
                  ))}

                  {/* Footer Total Weighted Percentage Score Row */}
                  <TableRow sx={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Total Weighted Score (%):
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: totalWeightage !== 100 ? 'error.main' : 'success.main' }}>
                      {totalWeightage}%
                    </TableCell>
                    {months.map((m) => {
                      const empTotal = calculateMonthlyTotal(m, 'empScore');
                      const rmTotal = calculateMonthlyTotal(m, 'rmScore');
                      const isCurrent = m === currentMonthTag;

                      return (
                        <React.Fragment key={m}>
                          {/* Emp Total Weighted % */}
                          <TableCell
                            sx={{
                              backgroundColor: isCurrent ? '#c8e6c9' : '#bbdefb',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              color: empTotal !== '-' ? '#1b5e20' : 'text.disabled'
                            }}
                          >
                            {empTotal}
                          </TableCell>
                          {/* RM Total Weighted % */}
                          <TableCell
                            sx={{
                              backgroundColor: '#ffe0b2',
                              borderRight: '1px solid #cbd5e1',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              color: rmTotal !== '-' ? '#e65100' : 'text.disabled'
                            }}
                          >
                            {rmTotal}
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KRAView;
