import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Alert, Snackbar, CircularProgress, Card, CardContent, Chip
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon, Assessment as KraIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { mockFinancialYears } from './mockData';

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

const MyKRA: React.FC = () => {
  const { user } = useAuth();

  const [selectedEmployeeId] = useState<string>(
    String(user?.employeeId || (user as any)?.id || localStorage.getItem('employeeId') || '1')
  );
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>(mockFinancialYears[3] || '2026-2027');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { empScore: string | number; rmScore: string | number }>>({});
  const [savedScoresMap, setSavedScoresMap] = useState<Record<string, { empScore: string | number; rmScore: string | number }>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const months = useMemo(() => generateMonths(selectedFinancialYear), [selectedFinancialYear]);
  const currentMonthTag = useMemo(() => getCurrentMonthTag(), []);

  // Load My KRA Data
  const loadMyKRA = useCallback(async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    try {
      const res = await apiService.getMyKRA(selectedEmployeeId, selectedFinancialYear);
      if (res?.success && res.data) {
        setTemplate(res.data.template || null);
        setItems(res.data.items || []);
        
        // Initialize scores map
        const loadedScores: Record<string, { empScore: string | number; rmScore: string | number }> = {};
        const backendScores = res.data.scores || {};
        
        const currentMonths = generateMonths(selectedFinancialYear);
        (res.data.items || []).forEach((item: any) => {
          currentMonths.forEach((m) => {
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
      console.error('Error loading My KRA:', err);
      setSnackbar({ open: true, message: 'Failed to load KRA data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, selectedFinancialYear]);

  useEffect(() => {
    loadMyKRA();
  }, [loadMyKRA]);

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

  const handleSave = async () => {
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
        financialYear: selectedFinancialYear,
        templateId: template?.id,
        scores: scoreList,
      });

      setSavedScoresMap(JSON.parse(JSON.stringify(scores)));
      setSnackbar({ open: true, message: 'KRA scores saved successfully! Entry is now locked.', severity: 'success' });
    } catch (err) {
      console.error('Error saving KRA scores:', err);
      setSnackbar({ open: true, message: 'Error saving KRA scores.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Helper to check if current month score is already saved
  const isMonthSaved = useCallback((month: string) => {
    if (items.length === 0) return false;
    return items.every((item) => {
      const key = `${item.id}_${month}`;
      const saved = savedScoresMap[key];
      return saved && saved.empScore !== '' && saved.empScore !== null && saved.empScore !== undefined;
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
  const empDisplayName = user?.name || `Employee ${selectedEmployeeId}`;
  const isCurrentSaved = isMonthSaved(currentMonthTag);

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <KraIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            My KRA Assessment
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadMyKRA} disabled={loading || saving}>
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading || saving || !template || isCurrentSaved}
          >
            {saving ? 'Saving...' : isCurrentSaved ? 'Scores Submitted' : 'Save KRA Scores'}
          </Button>
        </Box>
      </Box>

      {/* Filter and Metadata Card */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 1 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Financial Year</InputLabel>
              <Select
                value={selectedFinancialYear}
                label="Financial Year"
                onChange={(e) => setSelectedFinancialYear(e.target.value)}
              >
                {mockFinancialYears.map((fy) => (
                  <MenuItem key={fy} value={fy}>
                    {fy}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Assigned Employee
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  {empDisplayName}
                </Typography>
                {template && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Template: {template.name} ({template.department || 'All'} - {template.designation || 'All'})
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Main KRA Score Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : !template ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No KRA template has been assigned for {empDisplayName} in {selectedFinancialYear}. Please contact your administrator.
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 2, borderRadius: 2 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6">Monthly KRA Performance Entry ({selectedFinancialYear})</Typography>
            <Typography variant="body2" color="text.secondary">
              {isCurrentSaved
                ? `Scores for ${currentMonthTag} have been submitted & locked.`
                : `Fill in your scores for the active month (${currentMonthTag}). Once saved, editing will be locked.`}
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
                    const saved = isMonthSaved(m);
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
                      const monthSaved = isMonthSaved(m);
                      const isEditable = isCurrent && !monthSaved;

                      return (
                        <React.Fragment key={m}>
                          {/* Emp Score Column - Fillable only if current month AND not saved yet */}
                          <TableCell sx={{ backgroundColor: isCurrent ? '#e8f5e9' : '#e3f2fd', p: 0.5, textAlign: 'center' }}>
                            {isEditable ? (
                              <TextField
                                fullWidth
                                type="number"
                                size="small"
                                variant="outlined"
                                value={sc.empScore}
                                onChange={(e) => handleScoreChange(item.id, m, 'empScore', e.target.value)}
                                inputProps={{ min: 0, max: 100, style: { textAlign: 'center', padding: '4px', fontSize: '0.85rem', fontWeight: 600 } }}
                                sx={{ 
                                  bgcolor: 'white', 
                                  borderRadius: 1,
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#2e7d32',
                                    borderWidth: 2
                                  }
                                }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 600, color: sc.empScore !== '' ? 'primary.main' : 'text.disabled' }}>
                                {sc.empScore !== '' ? sc.empScore : '-'}
                              </Typography>
                            )}
                          </TableCell>
                          {/* RM Score Column - Read Only for Employee */}
                          <TableCell sx={{ backgroundColor: '#fff3e0', borderRight: '1px solid #e0e0e0', p: 0.5, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: sc.rmScore !== '' ? 'primary.main' : 'text.disabled' }}>
                              {sc.rmScore !== '' ? sc.rmScore : '-'}
                            </Typography>
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
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyKRA;
