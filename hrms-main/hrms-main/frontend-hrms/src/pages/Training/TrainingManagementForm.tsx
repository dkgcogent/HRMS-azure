// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, Tab, Tabs,
    FormControl, InputLabel, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Card, CardContent, Avatar, Tooltip, Divider,
    Switch, FormControlLabel, LinearProgress,
} from '@mui/material';
import {
    School as TrainingIcon, Group as EnrollIcon, Add as AddIcon,
    Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon,
    PlayCircle as OngoingIcon, CheckCircle as CompletedIcon,
    Schedule as ScheduleIcon, Person as PersonIcon, Star as StarsIcon,
    Assignment as AssignmentIcon, CalendarMonth as CalIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel = ({ children, value, index }: TabPanelProps) => (
    <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

const trainingStatusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    DRAFT: 'default', SCHEDULED: 'primary', ONGOING: 'warning', COMPLETED: 'success', CANCELLED: 'error'
};
const enrollmentStatusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    ENROLLED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success'
};

const trainingCategories = ['Technical Skills', 'Soft Skills', 'Leadership', 'Compliance', 'Safety', 'Product Knowledge', 'Process Training', 'Orientation', 'Professional Development', 'Other'];

const TrainingManagementForm: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [programs, setPrograms] = useState<any[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; type: string }>({ open: false, id: 0, type: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

    const defaultProgram = { title: '', description: '', category: '', start_date: '', end_date: '', status: 'SCHEDULED' };
    const defaultEnrollment = { employee_id: '', training_program_id: '', status: 'ENROLLED' };

    const [programForm, setProgramForm] = useState({ ...defaultProgram });
    const [enrollForm, setEnrollForm] = useState({ ...defaultEnrollment });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [progRes, enrollRes, empRes] = await Promise.all([
                apiService.getTrainingPrograms(),
                apiService.getEmployeeTraining(),
                apiService.getEmployees(1, 1000),
            ]);

            if (progRes.success) setPrograms(progRes.data || []);
            if (enrollRes.success) setEnrollments(enrollRes.data || []);

            const empData = empRes?.data?.content || empRes?.data || [];
            setEmployees(empData);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
        } finally { setLoading(false); }
    };

    const handleSaveProgram = async () => {
        if (!programForm.title || !programForm.start_date) { setSnackbar({ open: true, message: 'Title and Start Date are required', severity: 'error' }); return; }
        try {
            const res = editingItem
                ? await apiService.updateTrainingProgram(editingItem.id, programForm)
                : await apiService.createTrainingProgram(programForm);

            if (res.success) {
                setSnackbar({ open: true, message: editingItem ? 'Program updated!' : 'Program created!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error saving program', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Server error', severity: 'error' });
        }
    };

    const handleSaveEnrollment = async () => {
        if (!enrollForm.employee_id || !enrollForm.training_program_id) {
            setSnackbar({ open: true, message: 'Please select employee and program', severity: 'error' });
            return;
        }
        try {
            const res = editingItem
                ? await apiService.updateEmployeeEnrollment(editingItem.id, enrollForm)
                : await apiService.enrollEmployee(enrollForm);
            if (res.success) {
                setSnackbar({ open: true, message: editingItem ? 'Enrollment updated!' : 'Employee enrolled!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error enrolling employee', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Server error', severity: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            const res = deleteDialog.type === 'program'
                ? await apiService.deleteTrainingProgram(deleteDialog.id)
                : await apiService.deleteEmployeeEnrollment(deleteDialog.id); // Implemented delete enrollment

            if (res.success) {
                setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
                setDeleteDialog({ open: false, id: 0, type: '' });
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error deleting', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Error deleting', severity: 'error' });
        }
    };

    const resetForms = () => {
        setEditingItem(null);
        setProgramForm({ ...defaultProgram });
        setEnrollForm({ ...defaultEnrollment });
    };

    const summaryCards = [
        { label: 'Total Programs', value: programs.length, color: '#2563eb', bg: '#dbeafe', icon: <AssignmentIcon /> },
        { label: 'Active/Ongoing', value: programs.filter(p => p.status === 'ONGOING' || p.status === 'SCHEDULED').length, color: '#d97706', bg: '#fef3c7', icon: <OngoingIcon /> },
        { label: 'Completed', value: programs.filter(p => p.status === 'COMPLETED').length, color: '#059669', bg: '#d1fae5', icon: <CompletedIcon /> },
        { label: 'Total Enrollments', value: enrollments.length, color: '#7c3aed', bg: '#ede9fe', icon: <PersonIcon /> },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrainingIcon sx={{ color: '#2563eb', fontSize: 36 }} /> Training Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Manage training programs and employee enrollments</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForms(); setOpenDialog(true); }}
                    sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: 2, px: 3 }}>
                    {tab === 0 ? 'Add Program' : 'Enroll Employee'}
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {summaryCards.map((c, i) => (
                    <Card key={i} elevation={1} sx={{ flex: '1 1 180px', minWidth: 160 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: c.bg, color: c.color, width: 48, height: 48 }}>{c.icon}</Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" color={c.color}>{c.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Paper elevation={2} sx={{ borderRadius: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab icon={<TrainingIcon />} iconPosition="start" label={`Training Programs (${programs.length})`} />
                    <Tab icon={<EnrollIcon />} iconPosition="start" label={`Enrollments (${enrollments.length})`} />
                </Tabs>

                {/* Programs Tab */}
                <TabPanel value={tab} index={0}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#eff6ff' }}>
                                        {['Title', 'Category', 'Description', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#1e40af' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {programs.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <TrainingIcon sx={{ fontSize: 48, color: 'grey.300' }} />
                                            <Typography color="text.secondary" sx={{ mt: 1 }}>No training programs. Click "Add Program" to get started.</Typography>
                                        </TableCell></TableRow>
                                    ) : programs.map(p => (
                                        <TableRow key={p.id} hover>
                                            <TableCell><Typography fontWeight={600}>{p.title}</Typography></TableCell>
                                            <TableCell><Chip label={p.category || 'General'} size="small" variant="outlined" /></TableCell>
                                            <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{p.description || '-'}</Typography></TableCell>
                                            <TableCell>{p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                                            <TableCell>{p.end_date ? new Date(p.end_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                                            <TableCell><Chip label={p.status || 'SCHEDULED'} size="small" color={trainingStatusColors[p.status] || 'default'} /></TableCell>
                                            <TableCell>
                                                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => { setEditingItem(p); setProgramForm({ title: p.title, description: p.description || '', category: p.category || '', start_date: p.start_date?.split('T')[0] || '', end_date: p.end_date?.split('T')[0] || '', status: p.status || 'SCHEDULED' }); setOpenDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: p.id, type: 'program' })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>

                {/* Enrollments Tab */}
                <TabPanel value={tab} index={1}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f3ff' }}>
                                        {['Employee', 'Training Program', 'Enrollment Date', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#5b21b6' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {enrollments.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                            <EnrollIcon sx={{ fontSize: 48, color: 'grey.300' }} />
                                            <Typography color="text.secondary" sx={{ mt: 1 }}>No enrollments yet.</Typography>
                                        </TableCell></TableRow>
                                    ) : enrollments.map(e => (
                                        <TableRow key={e.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#7c3aed', fontSize: 12 }}>
                                                        {(e.employee_name || 'E').charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{e.employee_name || `Employee #${e.employee_id}`}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{e.emp_code}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{e.training_title || e.program_title || `Program #${e.training_program_id}`}</Typography>
                                                <Typography variant="caption" color="text.secondary">{e.category}</Typography>
                                            </TableCell>
                                            <TableCell>{e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : '-'}</TableCell>
                                            <TableCell><Chip label={e.status} size="small" color={enrollmentStatusColors[e.status] || 'default'} /></TableCell>
                                            <TableCell>
                                                <Tooltip title="Update Status"><IconButton size="small" color="primary" onClick={() => { setEditingItem(e); setEnrollForm({ employee_id: e.employee_id, training_program_id: e.training_program_id, status: e.status }); setOpenDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: e.id, type: 'enrollment' })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>
            </Paper>

            {/* Program Dialog */}
            {tab === 0 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TrainingIcon /> {editingItem ? 'Edit Training Program' : 'Create Training Program'}</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={12}><TextField fullWidth required label="Training Title" value={programForm.title} onChange={e => setProgramForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Advanced Excel Training" /></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth><InputLabel>Category</InputLabel><Select value={programForm.category} label="Category" onChange={e => setProgramForm(p => ({ ...p, category: e.target.value }))}>{trainingCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={programForm.status} label="Status" onChange={e => setProgramForm(p => ({ ...p, status: e.target.value }))}><MenuItem value="DRAFT">Draft</MenuItem><MenuItem value="SCHEDULED">Scheduled</MenuItem><MenuItem value="ONGOING">Ongoing</MenuItem><MenuItem value="COMPLETED">Completed</MenuItem><MenuItem value="CANCELLED">Cancelled</MenuItem></Select></FormControl></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label="Start Date" type="date" value={programForm.start_date} onChange={e => setProgramForm(p => ({ ...p, start_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="End Date" type="date" value={programForm.end_date} onChange={e => setProgramForm(p => ({ ...p, end_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid size={12}><TextField fullWidth multiline rows={3} label="Description" value={programForm.description} onChange={e => setProgramForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the training objectives and content..." /></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveProgram} sx={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                            {editingItem ? 'Update Program' : 'Create Program'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Enrollment Dialog */}
            {tab === 1 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EnrollIcon /> {editingItem ? 'Update Enrollment' : 'Enroll Employee'}</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={12}><FormControl fullWidth required><InputLabel>Employee</InputLabel><Select value={enrollForm.employee_id} label="Employee" onChange={e => setEnrollForm(p => ({ ...p, employee_id: e.target.value }))}>{employees.map(e => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={12}><FormControl fullWidth required><InputLabel>Training Program</InputLabel><Select value={enrollForm.training_program_id} label="Training Program" onChange={e => setEnrollForm(p => ({ ...p, training_program_id: e.target.value }))}>{programs.map(p => <MenuItem key={p.id} value={p.id}>{p.title} {p.status && `(${p.status})`}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={12}><FormControl fullWidth><InputLabel>Enrollment Status</InputLabel><Select value={enrollForm.status} label="Enrollment Status" onChange={e => setEnrollForm(p => ({ ...p, status: e.target.value }))}><MenuItem value="ENROLLED">Enrolled</MenuItem><MenuItem value="IN_PROGRESS">In Progress</MenuItem><MenuItem value="COMPLETED">Completed</MenuItem></Select></FormControl></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveEnrollment} sx={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                            {editingItem ? 'Update' : 'Enroll'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: 0, type: '' })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this {deleteDialog.type}?</Typography></DialogContent>
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

export default TrainingManagementForm;
