// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, Tab, Tabs,
    FormControl, InputLabel, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Avatar, Tooltip, Card, CardContent, Divider,
} from '@mui/material';
import {
    EmojiEvents as AwardIcon, School as CertIcon, Add as AddIcon,
    Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon,
    WorkspacePremium as CertBadge, Star as StarIcon, Person as PersonIcon,
    CalendarToday as CalIcon, Business as OrgIcon, Verified as VerifiedIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel = ({ children, value, index }: TabPanelProps) => (
    <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

const awardTypes = ['RECOGNITION', 'ACHIEVEMENT', 'SERVICE', 'PERFORMANCE', 'INNOVATION', 'LEADERSHIP', 'TEAMWORK', 'OTHER'];
const awardCategories = ['PERFORMANCE', 'ATTENDANCE', 'INNOVATION', 'LEADERSHIP', 'TEAMWORK', 'SERVICE_YEARS', 'CUSTOMER_SATISFACTION', 'OTHER'];
const awardTypeColors: Record<string, string> = {
    RECOGNITION: '#7c3aed', ACHIEVEMENT: '#059669', SERVICE: '#2563eb',
    PERFORMANCE: '#d97706', INNOVATION: '#dc2626', LEADERSHIP: '#7c3aed',
    TEAMWORK: '#0891b2', OTHER: '#6b7280'
};

const AwardsCertificationsForm: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [employees, setEmployees] = useState<any[]>([]);
    const [awards, setAwards] = useState<any[]>([]);
    const [certifications, setCertifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; type: string }>({ open: false, id: 0, type: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

    const [awardForm, setAwardForm] = useState({
        employee_id: '', award_name: '', award_type: 'RECOGNITION', category: 'PERFORMANCE',
        description: '', award_date: '', given_by: '', certificate_number: '', remarks: '', status: 'ACTIVE'
    });

    const [certForm, setCertForm] = useState({
        employee_id: '', certification_name: '', issuing_organization: '', certification_number: '',
        issue_date: '', expiry_date: '', skill_area: '', description: '', is_mandatory: false, status: 'ACTIVE'
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [empRes, awardRes, certRes] = await Promise.all([
                apiService.getEmployees(1, 1000),
                apiService.getAwards(),
                apiService.getCertifications(),
            ]);

            const empData = empRes?.data?.content || empRes?.data || [];
            setEmployees(empData);
            if (awardRes.success) setAwards(awardRes.data || []);
            if (certRes.success) setCertifications(certRes.data || []);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
        } finally { setLoading(false); }
    };

    const handleSaveAward = async () => {
        if (!awardForm.employee_id || !awardForm.award_name || !awardForm.award_date) {
            setSnackbar({ open: true, message: 'Please fill required fields', severity: 'error' }); return;
        }
        try {
            const res = editingItem
                ? await apiService.updateAward(editingItem.id, awardForm)
                : await apiService.createAward(awardForm);

            if (res.success) {
                setSnackbar({ open: true, message: editingItem ? 'Award updated!' : 'Award created!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error saving award', severity: 'error' });
            }
        } catch { setSnackbar({ open: true, message: 'Server error', severity: 'error' }); }
    };

    const handleSaveCert = async () => {
        if (!certForm.employee_id || !certForm.certification_name || !certForm.issuing_organization) {
            setSnackbar({ open: true, message: 'Please fill required fields', severity: 'error' }); return;
        }
        try {
            const res = editingItem
                ? await apiService.updateCertification(editingItem.id, certForm)
                : await apiService.createCertification(certForm);

            if (res.success) {
                setSnackbar({ open: true, message: editingItem ? 'Certification updated!' : 'Certification created!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error saving certification', severity: 'error' });
            }
        } catch { setSnackbar({ open: true, message: 'Server error', severity: 'error' }); }
    };

    const handleDelete = async () => {
        try {
            const res = deleteDialog.type === 'award'
                ? await apiService.deleteAward(deleteDialog.id)
                : await apiService.deleteCertification(deleteDialog.id);

            if (res.success) {
                setSnackbar({ open: true, message: 'Deleted', severity: 'success' });
                setDeleteDialog({ open: false, id: 0, type: '' });
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error deleting', severity: 'error' });
            }
        } catch { setSnackbar({ open: true, message: 'Error deleting', severity: 'error' }); }
    };

    const resetForms = () => {
        setEditingItem(null);
        setAwardForm({ employee_id: '', award_name: '', award_type: 'RECOGNITION', category: 'PERFORMANCE', description: '', award_date: '', given_by: '', certificate_number: '', remarks: '', status: 'ACTIVE' });
        setCertForm({ employee_id: '', certification_name: '', issuing_organization: '', certification_number: '', issue_date: '', expiry_date: '', skill_area: '', description: '', is_mandatory: false, status: 'ACTIVE' });
    };

    const openEditAward = (item: any) => { setEditingItem(item); setAwardForm({ employee_id: item.employee_id, award_name: item.award_name, award_type: item.award_type, category: item.category, description: item.description || '', award_date: item.award_date?.split('T')[0] || '', given_by: item.given_by || '', certificate_number: item.certificate_number || '', remarks: item.remarks || '', status: item.status }); setOpenDialog(true); };
    const openEditCert = (item: any) => { setEditingItem(item); setCertForm({ employee_id: item.employee_id, certification_name: item.certification_name, issuing_organization: item.issuing_organization, certification_number: item.certification_number || '', issue_date: item.issue_date?.split('T')[0] || '', expiry_date: item.expiry_date?.split('T')[0] || '', skill_area: item.skill_area || '', description: item.description || '', is_mandatory: item.is_mandatory, status: item.status }); setOpenDialog(true); };

    const isExpired = (date: string) => date && new Date(date) < new Date();

    const summaryCards = [
        { label: 'Total Awards', value: awards.length, icon: <AwardIcon />, color: '#7c3aed', bg: '#ede9fe' },
        { label: 'This Year Awards', value: awards.filter(a => new Date(a.award_date)?.getFullYear() === new Date().getFullYear()).length, icon: <StarIcon />, color: '#d97706', bg: '#fef3c7' },
        { label: 'Certifications', value: certifications.length, icon: <CertBadge />, color: '#059669', bg: '#d1fae5' },
        { label: 'Expiring Soon', value: certifications.filter(c => c.expiry_date && new Date(c.expiry_date) > new Date() && new Date(c.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length, icon: <CalIcon />, color: '#dc2626', bg: '#fee2e2' },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AwardIcon sx={{ color: '#7c3aed', fontSize: 36 }} /> Awards & Certifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Manage employee awards, recognitions, and professional certifications</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForms(); setOpenDialog(true); }}
                    sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: 2, px: 3 }}>
                    Add {tab === 0 ? 'Award' : 'Certification'}
                </Button>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {summaryCards.map((card, i) => (
                    <Card key={i} elevation={1} sx={{ flex: '1 1 180px', minWidth: 160 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 48, height: 48 }}>{card.icon}</Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" color={card.color}>{card.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Tabs */}
            <Paper elevation={2} sx={{ borderRadius: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab icon={<AwardIcon />} iconPosition="start" label={`Awards (${awards.length})`} />
                    <Tab icon={<CertBadge />} iconPosition="start" label={`Certifications (${certifications.length})`} />
                </Tabs>

                {/* Awards Tab */}
                <TabPanel value={tab} index={0}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Award</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Given By</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Certificate #</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {awards.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                            <AwardIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                                            <Typography color="text.secondary">No awards recorded yet. Click "Add Award" to get started.</Typography>
                                        </TableCell></TableRow>
                                    ) : awards.map(award => (
                                        <TableRow key={award.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#7c3aed', fontSize: 12 }}>
                                                        {award.employee_name?.split(' ').map((n: string) => n[0]).join('')}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{award.employee_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{award.emp_code}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography fontWeight={600}>{award.award_name}</Typography></TableCell>
                                            <TableCell>
                                                <Chip label={award.award_type} size="small"
                                                    sx={{ bgcolor: awardTypeColors[award.award_type] + '22', color: awardTypeColors[award.award_type], fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{award.category?.replace('_', ' ')}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{award.award_date ? new Date(award.award_date).toLocaleDateString('en-IN') : '-'}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{award.given_by || '-'}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontFamily="monospace">{award.certificate_number || '-'}</Typography></TableCell>
                                            <TableCell>
                                                <Chip label={award.status} size="small" color={award.status === 'ACTIVE' ? 'success' : 'default'} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditAward(award)} color="primary"><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: award.id, type: 'award' })} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>

                {/* Certifications Tab */}
                <TabPanel value={tab} index={1}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Certification</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Issuing Org</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Skill Area</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Issue Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Mandatory</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {certifications.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                            <CertBadge sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                                            <Typography color="text.secondary">No certifications recorded yet.</Typography>
                                        </TableCell></TableRow>
                                    ) : certifications.map(cert => (
                                        <TableRow key={cert.id} hover sx={{ bgcolor: isExpired(cert.expiry_date) ? '#fff5f5' : 'inherit' }}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#059669', fontSize: 12 }}>
                                                        {cert.employee_name?.split(' ').map((n: string) => n[0]).join('')}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{cert.employee_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{cert.emp_code}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <VerifiedIcon sx={{ fontSize: 16, color: '#059669' }} />
                                                    <Typography fontWeight={600}>{cert.certification_name}</Typography>
                                                </Box>
                                                {cert.certification_number && <Typography variant="caption" color="text.secondary">#{cert.certification_number}</Typography>}
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{cert.issuing_organization}</Typography></TableCell>
                                            <TableCell><Chip label={cert.skill_area || 'General'} size="small" variant="outlined" /></TableCell>
                                            <TableCell><Typography variant="body2">{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-IN') : '-'}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color={isExpired(cert.expiry_date) ? 'error' : 'text.primary'} fontWeight={isExpired(cert.expiry_date) ? 700 : 400}>
                                                    {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString('en-IN') : 'No Expiry'}
                                                </Typography>
                                                {isExpired(cert.expiry_date) && <Chip label="EXPIRED" size="small" color="error" sx={{ mt: 0.5 }} />}
                                            </TableCell>
                                            <TableCell><Chip label={cert.is_mandatory ? 'Mandatory' : 'Optional'} size="small" color={cert.is_mandatory ? 'warning' : 'default'} /></TableCell>
                                            <TableCell><Chip label={cert.status} size="small" color={cert.status === 'ACTIVE' ? 'success' : cert.status === 'EXPIRED' ? 'error' : 'default'} /></TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditCert(cert)} color="primary"><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: cert.id, type: 'certification' })} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>
            </Paper>

            {/* Award Dialog */}
            {tab === 0 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AwardIcon /> {editingItem ? 'Edit Award' : 'Add New Award'}</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Employee</InputLabel>
                                    <Select value={awardForm.employee_id} label="Employee" onChange={e => setAwardForm(p => ({ ...p, employee_id: e.target.value }))}>
                                        {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName} - {e.employeeId}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth required label="Award Name" value={awardForm.award_name} onChange={e => setAwardForm(p => ({ ...p, award_name: e.target.value }))} placeholder="e.g. Employee of the Month" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Award Type</InputLabel>
                                    <Select value={awardForm.award_type} label="Award Type" onChange={e => setAwardForm(p => ({ ...p, award_type: e.target.value }))}>
                                        {awardTypes.map(t => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select value={awardForm.category} label="Category" onChange={e => setAwardForm(p => ({ ...p, category: e.target.value }))}>
                                        {awardCategories.map(c => <MenuItem key={c} value={c}>{c.replace('_', ' ')}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth required label="Award Date" type="date" value={awardForm.award_date} onChange={e => setAwardForm(p => ({ ...p, award_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth label="Given By" value={awardForm.given_by} onChange={e => setAwardForm(p => ({ ...p, given_by: e.target.value }))} placeholder="e.g. CEO / HR Manager" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth label="Certificate Number" value={awardForm.certificate_number} onChange={e => setAwardForm(p => ({ ...p, certificate_number: e.target.value }))} placeholder="e.g. CERT-2025-001" />
                            </Grid>
                            <Grid size={12}>
                                <TextField fullWidth multiline rows={3} label="Description" value={awardForm.description} onChange={e => setAwardForm(p => ({ ...p, description: e.target.value }))} />
                            </Grid>
                            <Grid size={12}>
                                <TextField fullWidth multiline rows={2} label="Remarks" value={awardForm.remarks} onChange={e => setAwardForm(p => ({ ...p, remarks: e.target.value }))} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveAward} sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
                            {editingItem ? 'Update Award' : 'Create Award'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Certification Dialog */}
            {tab === 1 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)', color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CertBadge /> {editingItem ? 'Edit Certification' : 'Add Certification'}</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Employee</InputLabel>
                                    <Select value={certForm.employee_id} label="Employee" onChange={e => setCertForm(p => ({ ...p, employee_id: e.target.value }))}>
                                        {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName} - {e.employeeId}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth required label="Certification Name" value={certForm.certification_name} onChange={e => setCertForm(p => ({ ...p, certification_name: e.target.value }))} placeholder="e.g. AWS Solutions Architect" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth required label="Issuing Organization" value={certForm.issuing_organization} onChange={e => setCertForm(p => ({ ...p, issuing_organization: e.target.value }))} placeholder="e.g. Amazon Web Services" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth label="Certification Number" value={certForm.certification_number} onChange={e => setCertForm(p => ({ ...p, certification_number: e.target.value }))} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth label="Issue Date" type="date" value={certForm.issue_date} onChange={e => setCertForm(p => ({ ...p, issue_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth label="Expiry Date" type="date" value={certForm.expiry_date} onChange={e => setCertForm(p => ({ ...p, expiry_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth label="Skill Area" value={certForm.skill_area} onChange={e => setCertForm(p => ({ ...p, skill_area: e.target.value }))} placeholder="e.g. Cloud Computing" />
                            </Grid>
                            <Grid size={12}>
                                <TextField fullWidth multiline rows={2} label="Description" value={certForm.description} onChange={e => setCertForm(p => ({ ...p, description: e.target.value }))} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Mandatory</InputLabel>
                                    <Select value={certForm.is_mandatory ? 'true' : 'false'} label="Mandatory" onChange={e => setCertForm(p => ({ ...p, is_mandatory: e.target.value === 'true' }))}>
                                        <MenuItem value="true">Yes - Mandatory</MenuItem>
                                        <MenuItem value="false">No - Optional</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={certForm.status} label="Status" onChange={e => setCertForm(p => ({ ...p, status: e.target.value }))}>
                                        <MenuItem value="ACTIVE">Active</MenuItem>
                                        <MenuItem value="EXPIRED">Expired</MenuItem>
                                        <MenuItem value="REVOKED">Revoked</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveCert} sx={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}>
                            {editingItem ? 'Update Certification' : 'Save Certification'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: 0, type: '' })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this {deleteDialog.type}? This action cannot be undone.</Typography></DialogContent>
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

export default AwardsCertificationsForm;
