// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, Tab, Tabs,
    FormControl, InputLabel, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Card, CardContent, Avatar, Tooltip, Divider, LinearProgress,
} from '@mui/material';
import {
    AccountBalance as EsiIcon, Savings as PfIcon, Add as AddIcon,
    Edit as EditIcon, Delete as DeleteIcon, Sync as SyncIcon,
    Close as CloseIcon, CheckCircle as PaidIcon, Pending as PendingIcon,
    Warning as WarningIcon, PieChart as ChartIcon, CurrencyRupee as RupeeIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel = ({ children, value, index }: TabPanelProps) => (
    <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

const ComplianceForm: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [employees, setEmployees] = useState<any[]>([]);
    const [esiRecords, setEsiRecords] = useState<any[]>([]);
    const [pfRecords, setPfRecords] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ esi: { count: 0, total: 0 }, pf: { count: 0, total: 0 } });
    const [loading, setLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; type: string }>({ open: false, id: 0, type: '' });
    const [syncDialog, setSyncDialog] = useState(false);
    const [syncMonth, setSyncMonth] = useState(new Date().getMonth() + 1);
    const [syncYear, setSyncYear] = useState(currentYear);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

    const [esiForm, setEsiForm] = useState({
        employee_id: '', esi_number: '', month: new Date().getMonth() + 1, year: currentYear,
        gross_wages: '', payment_date: '', remarks: '', status: 'PENDING'
    });
    const [pfForm, setPfForm] = useState({
        employee_id: '', uan_number: '', pf_account_number: '', month: new Date().getMonth() + 1, year: currentYear,
        basic_salary: '', payment_date: '', remarks: '', status: 'PENDING'
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [empRes, esiRes, pfRes, sumRes] = await Promise.all([
                apiService.getEmployees(1, 1000),
                apiService.getEsiRecords(),
                apiService.getPfRecords(),
                apiService.getComplianceSummary(),
            ]);

            const empData = empRes?.data?.content || empRes?.data || [];
            setEmployees(empData);
            if (esiRes.success) setEsiRecords(esiRes.data || []);
            if (pfRes.success) setPfRecords(pfRes.data || []);
            if (sumRes.success) setSummary(sumRes.data);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
        }
        finally { setLoading(false); }
    };

    const handleSaveEsi = async () => {
        if (!esiForm.employee_id || !esiForm.month || !esiForm.year) {
            setSnackbar({ open: true, message: 'Please fill required fields', severity: 'error' }); return;
        }
        try {
            const res = editingItem
                ? await apiService.updateEsiRecord(editingItem.id, esiForm)
                : await apiService.createEsiRecord(esiForm);

            if (res.success) {
                setSnackbar({ open: true, message: editingItem ? 'ESI updated!' : 'ESI record created!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            }
            else setSnackbar({ open: true, message: res.message || 'Error', severity: 'error' });
        } catch { setSnackbar({ open: true, message: 'Server error', severity: 'error' }); }
    };

    const handleSavePf = async () => {
        if (!pfForm.employee_id || !pfForm.month || !pfForm.year) {
            setSnackbar({ open: true, message: 'Please fill required fields', severity: 'error' }); return;
        }
        try {
            const res = editingItem
                ? await apiService.updatePfRecord(editingItem.id, pfForm)
                : await apiService.createPfRecord(pfForm);

            if (res.success) {
                setSnackbar({ open: true, message: editingItem ? 'PF updated!' : 'PF record created!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            }
            else setSnackbar({ open: true, message: res.message || 'Error', severity: 'error' });
        } catch { setSnackbar({ open: true, message: 'Server error', severity: 'error' }); }
    };

    const handleDelete = async () => {
        try {
            const res = deleteDialog.type === 'esi'
                ? await apiService.deleteEsiRecord(deleteDialog.id)
                : await apiService.deletePfRecord(deleteDialog.id);

            if (res.success) {
                setSnackbar({ open: true, message: 'Deleted', severity: 'success' });
                setDeleteDialog({ open: false, id: 0, type: '' });
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error deleting', severity: 'error' });
            }
        } catch { setSnackbar({ open: true, message: 'Error deleting', severity: 'error' }); }
    };

    const handleSync = async () => {
        setSyncLoading(true);
        try {
            const res = await apiService.syncComplianceRecords(syncMonth, syncYear);
            if (res.success) {
                setSnackbar({ open: true, message: res.message, severity: 'success' });
                setSyncDialog(false);
                loadData();
            }
            else setSnackbar({ open: true, message: res.message || 'Sync failed', severity: 'error' });
        } catch { setSnackbar({ open: true, message: 'Server error', severity: 'error' }); }
        finally { setSyncLoading(false); }
    };

    const resetForms = () => {
        setEditingItem(null);
        setEsiForm({ employee_id: '', esi_number: '', month: new Date().getMonth() + 1, year: currentYear, gross_wages: '', payment_date: '', remarks: '', status: 'PENDING' });
        setPfForm({ employee_id: '', uan_number: '', pf_account_number: '', month: new Date().getMonth() + 1, year: currentYear, basic_salary: '', payment_date: '', remarks: '', status: 'PENDING' });
    };

    const statusColor = (s: string) => s === 'PAID' ? 'success' : s === 'OVERDUE' ? 'error' : 'warning';

    const summaryCards = [
        { label: 'ESI Records', value: esiRecords.length, icon: <EsiIcon />, color: '#2563eb', bg: '#dbeafe', sub: `₹${Number(summary.esi?.total || 0).toLocaleString('en-IN')} Total` },
        { label: 'PF Records', value: pfRecords.length, icon: <PfIcon />, color: '#059669', bg: '#d1fae5', sub: `₹${Number(summary.pf?.total || 0).toLocaleString('en-IN')} Total` },
        { label: 'ESI Pending', value: esiRecords.filter(r => r.status === 'PENDING').length, icon: <PendingIcon />, color: '#d97706', bg: '#fef3c7', sub: 'Pending payment' },
        { label: 'PF Pending', value: pfRecords.filter(r => r.status === 'PENDING').length, icon: <WarningIcon />, color: '#dc2626', bg: '#fee2e2', sub: 'Pending payment' },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EsiIcon sx={{ color: '#2563eb', fontSize: 36 }} /> Compliance - ESI / PF
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Manage Employee State Insurance (ESI) and Provident Fund (PF) compliance records</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<SyncIcon />} onClick={() => setSyncDialog(true)}>Auto Sync</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForms(); setOpenDialog(true); }}
                        sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: 2 }}>
                        Add Record
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {summaryCards.map((c, i) => (
                    <Card key={i} elevation={1} sx={{ flex: '1 1 200px', minWidth: 180 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: c.bg, color: c.color, width: 48, height: 48 }}>{c.icon}</Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" color={c.color}>{c.value}</Typography>
                                <Typography variant="body2" fontWeight={600}>{c.label}</Typography>
                                <Typography variant="caption" color="text.secondary">{c.sub}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Compliance Info Banner */}
            <Paper sx={{ p: 2, mb: 3, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box><Typography variant="subtitle2" fontWeight={700} color="#1e40af">ESI Contribution Rates</Typography>
                        <Typography variant="body2" color="#1e40af">Employee: 0.75% | Employer: 3.25%</Typography>
                        <Typography variant="caption" color="#3b82f6">Applicable for gross salary ≤ ₹21,000/month</Typography></Box>
                    <Divider orientation="vertical" flexItem />
                    <Box><Typography variant="subtitle2" fontWeight={700} color="#065f46">PF Contribution Rates</Typography>
                        <Typography variant="body2" color="#065f46">Employee: 12% | Employer: 12% of Basic</Typography>
                        <Typography variant="caption" color="#059669">EPS: 8.33% of basic (max ₹15,000)</Typography></Box>
                </Box>
            </Paper>

            {/* Tabs */}
            <Paper elevation={2} sx={{ borderRadius: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab icon={<EsiIcon />} iconPosition="start" label={`ESI Records (${esiRecords.length})`} />
                    <Tab icon={<PfIcon />} iconPosition="start" label={`PF Records (${pfRecords.length})`} />
                </Tabs>

                {/* ESI Tab */}
                <TabPanel value={tab} index={0}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#eff6ff' }}>
                                        {['Employee', 'ESI Number', 'Period', 'Gross Wages', 'Emp. Contribution (0.75%)', 'Employer Cont. (3.25%)', 'Total', 'Payment Date', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#1e40af' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {esiRecords.length === 0 ? (
                                        <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                            <EsiIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                                            <Typography color="text.secondary">No ESI records found. Use "Auto Sync" to generate records for all employees.</Typography>
                                        </TableCell></TableRow>
                                    ) : esiRecords.map(r => (
                                        <TableRow key={r.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{r.employee_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{r.emp_code}</Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="body2" fontFamily="monospace">{r.esi_number || '-'}</Typography></TableCell>
                                            <TableCell><Chip label={`${months[r.month - 1]} ${r.year}`} size="small" variant="outlined" /></TableCell>
                                            <TableCell><Typography variant="body2">₹{Number(r.gross_wages).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" color="#2563eb" fontWeight={600}>₹{Number(r.esi_employee_contribution).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" color="#7c3aed" fontWeight={600}>₹{Number(r.esi_employer_contribution).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={700}>₹{Number(r.total_contribution).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{r.payment_date ? new Date(r.payment_date).toLocaleDateString('en-IN') : '-'}</Typography></TableCell>
                                            <TableCell><Chip label={r.status} size="small" color={statusColor(r.status)} /></TableCell>
                                            <TableCell>
                                                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => { setEditingItem(r); setEsiForm({ employee_id: r.employee_id, esi_number: r.esi_number || '', month: r.month, year: r.year, gross_wages: r.gross_wages, payment_date: r.payment_date?.split('T')[0] || '', remarks: r.remarks || '', status: r.status }); setOpenDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: r.id, type: 'esi' })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>

                {/* PF Tab */}
                <TabPanel value={tab} index={1}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                                        {['Employee', 'UAN Number', 'PF Account', 'Period', 'Basic Salary', 'Emp. PF (12%)', 'Employer PF (12%)', 'EPS (8.33%)', 'Total', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#065f46' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pfRecords.length === 0 ? (
                                        <TableRow><TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                                            <PfIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                                            <Typography color="text.secondary">No PF records found. Use "Auto Sync" to generate records for all employees.</Typography>
                                        </TableCell></TableRow>
                                    ) : pfRecords.map(r => (
                                        <TableRow key={r.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{r.employee_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{r.emp_code}</Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="body2" fontFamily="monospace">{r.uan_number || '-'}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontFamily="monospace">{r.pf_account_number || '-'}</Typography></TableCell>
                                            <TableCell><Chip label={`${months[r.month - 1]} ${r.year}`} size="small" variant="outlined" /></TableCell>
                                            <TableCell>₹{Number(r.basic_salary).toLocaleString('en-IN')}</TableCell>
                                            <TableCell><Typography color="#2563eb" fontWeight={600}>₹{Number(r.pf_employee_contribution).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Typography color="#7c3aed" fontWeight={600}>₹{Number(r.pf_employer_contribution).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Typography color="#d97706">₹{Number(r.eps_contribution).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Typography fontWeight={700}>₹{Number(r.total_contribution).toLocaleString('en-IN')}</Typography></TableCell>
                                            <TableCell><Chip label={r.status} size="small" color={statusColor(r.status)} /></TableCell>
                                            <TableCell>
                                                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => { setEditingItem(r); setPfForm({ employee_id: r.employee_id, uan_number: r.uan_number || '', pf_account_number: r.pf_account_number || '', month: r.month, year: r.year, basic_salary: r.basic_salary, payment_date: r.payment_date?.split('T')[0] || '', remarks: r.remarks || '', status: r.status }); setOpenDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: r.id, type: 'pf' })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>
            </Paper>

            {/* ESI Dialog */}
            {tab === 0 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EsiIcon /> {editingItem ? 'Edit ESI Record' : 'Add ESI Record'}</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={12}><FormControl fullWidth required><InputLabel>Employee</InputLabel><Select value={esiForm.employee_id} label="Employee" onChange={e => setEsiForm(p => ({ ...p, employee_id: e.target.value }))}>{employees.map(e => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={12}><TextField fullWidth label="ESI Number" value={esiForm.esi_number} onChange={e => setEsiForm(p => ({ ...p, esi_number: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 6 }}><FormControl fullWidth required><InputLabel>Month</InputLabel><Select value={esiForm.month} label="Month" onChange={e => setEsiForm(p => ({ ...p, month: Number(e.target.value) }))}>{months.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 6 }}><FormControl fullWidth required><InputLabel>Year</InputLabel><Select value={esiForm.year} label="Year" onChange={e => setEsiForm(p => ({ ...p, year: Number(e.target.value) }))}>{years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={12}><TextField fullWidth required label="Gross Wages" type="number" value={esiForm.gross_wages} onChange={e => setEsiForm(p => ({ ...p, gross_wages: e.target.value }))} InputProps={{ startAdornment: '₹' }} helperText="ESI applicable for gross ≤ ₹21,000/month. Employee: 0.75%, Employer: 3.25%" /></Grid>
                            <Grid size={12}><TextField fullWidth label="Payment Date" type="date" value={esiForm.payment_date} onChange={e => setEsiForm(p => ({ ...p, payment_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid size={12}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={esiForm.status} label="Status" onChange={e => setEsiForm(p => ({ ...p, status: e.target.value }))}><MenuItem value="PENDING">Pending</MenuItem><MenuItem value="PAID">Paid</MenuItem><MenuItem value="OVERDUE">Overdue</MenuItem></Select></FormControl></Grid>
                            <Grid size={12}><TextField fullWidth multiline rows={2} label="Remarks" value={esiForm.remarks} onChange={e => setEsiForm(p => ({ ...p, remarks: e.target.value }))} /></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveEsi} sx={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Save ESI Record</Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* PF Dialog */}
            {tab === 1 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #059669, #065f46)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PfIcon /> {editingItem ? 'Edit PF Record' : 'Add PF Record'}</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={12}><FormControl fullWidth required><InputLabel>Employee</InputLabel><Select value={pfForm.employee_id} label="Employee" onChange={e => setPfForm(p => ({ ...p, employee_id: e.target.value }))}>{employees.map(e => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="UAN Number" value={pfForm.uan_number} onChange={e => setPfForm(p => ({ ...p, uan_number: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="PF Account Number" value={pfForm.pf_account_number} onChange={e => setPfForm(p => ({ ...p, pf_account_number: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 6 }}><FormControl fullWidth required><InputLabel>Month</InputLabel><Select value={pfForm.month} label="Month" onChange={e => setPfForm(p => ({ ...p, month: Number(e.target.value) }))}>{months.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 6 }}><FormControl fullWidth required><InputLabel>Year</InputLabel><Select value={pfForm.year} label="Year" onChange={e => setPfForm(p => ({ ...p, year: Number(e.target.value) }))}>{years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={12}><TextField fullWidth required label="Basic Salary" type="number" value={pfForm.basic_salary} onChange={e => setPfForm(p => ({ ...p, basic_salary: e.target.value }))} InputProps={{ startAdornment: '₹' }} helperText="PF: 12% employee + 12% employer. EPS: 8.33% up to ₹15,000" /></Grid>
                            <Grid size={12}><TextField fullWidth label="Payment Date" type="date" value={pfForm.payment_date} onChange={e => setPfForm(p => ({ ...p, payment_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid size={12}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={pfForm.status} label="Status" onChange={e => setPfForm(p => ({ ...p, status: e.target.value }))}><MenuItem value="PENDING">Pending</MenuItem><MenuItem value="PAID">Paid</MenuItem><MenuItem value="OVERDUE">Overdue</MenuItem></Select></FormControl></Grid>
                            <Grid size={12}><TextField fullWidth multiline rows={2} label="Remarks" value={pfForm.remarks} onChange={e => setPfForm(p => ({ ...p, remarks: e.target.value }))} /></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSavePf} sx={{ background: 'linear-gradient(135deg, #059669, #065f46)' }}>Save PF Record</Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Sync Dialog */}
            <Dialog open={syncDialog} onClose={() => setSyncDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Auto Sync Compliance Records</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>This will auto-create ESI & PF records for all active employees for the selected month/year.</Alert>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 6 }}><FormControl fullWidth><InputLabel>Month</InputLabel><Select value={syncMonth} label="Month" onChange={e => setSyncMonth(Number(e.target.value))}>{months.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}</Select></FormControl></Grid>
                        <Grid size={{ xs: 6 }}><FormControl fullWidth><InputLabel>Year</InputLabel><Select value={syncYear} label="Year" onChange={e => setSyncYear(Number(e.target.value))}>{years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select></FormControl></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSyncDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSync} disabled={syncLoading} startIcon={<SyncIcon />}>
                        {syncLoading ? 'Syncing...' : 'Sync Records'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: 0, type: '' })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this {deleteDialog.type.toUpperCase()} record?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: 0, type: '' })}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ComplianceForm;
