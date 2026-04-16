// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, Tab, Tabs,
    FormControl, InputLabel, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Card, CardContent, Avatar, Tooltip, Divider,
    LinearProgress,
} from '@mui/material';
import {
    Badge as IdCardIcon, ContactPage as VisitingCardIcon, Add as AddIcon,
    Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon, Print as PrintIcon,
    QrCode as QrIcon, Person as PersonIcon, Phone as PhoneIcon,
    Email as EmailIcon, Business as OrgIcon, LocalHospital as BloodIcon,
    Preview as PreviewIcon, Download as DownloadIcon, CheckCircle as CheckIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel = ({ children, value, index }: TabPanelProps) => (
    <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
);

const cardTemplateColors: Record<string, string> = {
    STANDARD: '#6b7280', PREMIUM: '#7c3aed', EXECUTIVE: '#d97706', DIGITAL: '#0891b2'
};
const visitingStatusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    REQUESTED: 'default', DESIGN_PENDING: 'warning', APPROVED: 'info', PRINTING: 'secondary',
    DISPATCHED: 'primary', DELIVERED: 'success', CANCELLED: 'error'
};

const CardManagementForm: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [employees, setEmployees] = useState<any[]>([]);
    const [idCards, setIdCards] = useState<any[]>([]);
    const [visitingCards, setVisitingCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [previewDialog, setPreviewDialog] = useState<{ open: boolean; data: any }>({ open: false, data: null });
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; type: string }>({ open: false, id: 0, type: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

    const [idForm, setIdForm] = useState({
        employee_id: '', card_type: 'ID_CARD', issue_date: '', expiry_date: '', blood_group: '',
        emergency_contact: '', emergency_phone: '', address: '', remarks: ''
    });

    const [vcForm, setVcForm] = useState({
        employee_id: '', display_name: '', display_designation: '', display_department: '',
        company_name: 'DKG', mobile_on_card: '', email_on_card: '', office_phone: '',
        website: '', linkedin_url: '', address_on_card: '', quantity_requested: 100,
        card_template: 'STANDARD', remarks: ''
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [empRes, idRes, vcRes] = await Promise.all([
                apiService.getEmployees(1, 1000),
                apiService.getIdCards(),
                apiService.getVisitingCards(),
            ]);

            const empData = empRes?.data?.content || empRes?.data || [];
            setEmployees(empData);
            if (idRes.success) setIdCards(idRes.data || []);
            if (vcRes.success) setVisitingCards(vcRes.data || []);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
        } finally { setLoading(false); }
    };

    const handleSaveIdCard = async () => {
        if (!idForm.employee_id) { setSnackbar({ open: true, message: 'Please select an employee', severity: 'error' }); return; }
        try {
            const res = await apiService.createOrUpdateIdCard(idForm);
            if (res.success) {
                setSnackbar({ open: true, message: res.message || 'ID card issued!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            }
            else setSnackbar({ open: true, message: res.message || 'Error', severity: 'error' });
        } catch { setSnackbar({ open: true, message: 'Server error', severity: 'error' }); }
    };

    const handleSaveVc = async () => {
        if (!vcForm.employee_id) { setSnackbar({ open: true, message: 'Please select an employee', severity: 'error' }); return; }
        try {
            const res = editingItem
                ? await apiService.updateVisitingCard(editingItem.id, vcForm)
                : await apiService.createVisitingCard(vcForm);

            if (res.success) {
                setSnackbar({ open: true, message: editingItem ? 'Updated!' : 'Request created!', severity: 'success' });
                setOpenDialog(false);
                resetForms();
                loadData();
            }
            else setSnackbar({ open: true, message: res.message || 'Error', severity: 'error' });
        } catch { setSnackbar({ open: true, message: 'Server error', severity: 'error' }); }
    };

    const handleDelete = async () => {
        try {
            const res = deleteDialog.type === 'id'
                ? await apiService.deleteIdCard(deleteDialog.id)
                : await apiService.deleteVisitingCard(deleteDialog.id);

            if (res.success) {
                setSnackbar({ open: true, message: 'Deleted', severity: 'success' });
                setDeleteDialog({ open: false, id: 0, type: '' });
                loadData();
            } else {
                setSnackbar({ open: true, message: res.message || 'Error deleting', severity: 'error' });
            }
        } catch { setSnackbar({ open: true, message: 'Error', severity: 'error' }); }
    };

    const resetForms = () => {
        setEditingItem(null);
        setIdForm({ employee_id: '', card_type: 'ID_CARD', issue_date: '', expiry_date: '', blood_group: '', emergency_contact: '', emergency_phone: '', address: '', remarks: '' });
        setVcForm({ employee_id: '', display_name: '', display_designation: '', display_department: '', company_name: 'DKG', mobile_on_card: '', email_on_card: '', office_phone: '', website: '', linkedin_url: '', address_on_card: '', quantity_requested: 100, card_template: 'STANDARD', remarks: '' });
    };

    const handleEmployeeSelect = (empId: any, type: 'id' | 'vc') => {
        const emp = employees.find(e => e.id === empId || String(e.id) === String(empId));
        if (!emp) return;
        if (type === 'vc') {
            setVcForm(p => ({ ...p, employee_id: empId, display_name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(), display_designation: emp.designationName || emp.designation?.name || '', display_department: emp.departmentName || emp.department?.name || '', mobile_on_card: emp.mobile || '', email_on_card: emp.workEmail || emp.email || '' }));
        } else {
            setIdForm(p => ({ ...p, employee_id: empId }));
        }
    };

    const summaryCards = [
        { label: 'ID Cards Issued', value: idCards.length, color: '#2563eb', bg: '#dbeafe', icon: <IdCardIcon /> },
        { label: 'Active ID Cards', value: idCards.filter(c => c.status === 'ACTIVE').length, color: '#059669', bg: '#d1fae5', icon: <CheckIcon /> },
        { label: 'Visiting Card Requests', value: visitingCards.length, color: '#7c3aed', bg: '#ede9fe', icon: <VisitingCardIcon /> },
        { label: 'Cards Delivered', value: visitingCards.filter(c => c.status === 'DELIVERED').length, color: '#d97706', bg: '#fef3c7', icon: <PrintIcon /> },
    ];

    // ID Card Preview Component
    const IdCardPreview = ({ data }: { data: any }) => (
        <Box sx={{ width: 320, height: 200, background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', borderRadius: 3, p: 2.5, color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.8 }}>EMPLOYEE ID CARD</Typography>
                <Chip label={data?.card_number || 'ID0001'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.6rem' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}>
                    {data?.employee_name?.split(' ').map((n: string) => n[0]).join('') || 'EMP'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>{data?.employee_name || 'Employee Name'}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>{data?.designation_name || 'Designation'}</Typography>
                    <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>{data?.department_name || 'Department'}</Typography>
                </Box>
            </Box>
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    {data?.blood_group && <Chip label={`🩸 ${data.blood_group}`} size="small" sx={{ bgcolor: '#dc2626', color: 'white', fontSize: '0.65rem', mr: 0.5 }} />}
                    <Typography variant="caption" display="block" sx={{ opacity: 0.7, mt: 0.5 }}>Valid: {data?.expiry_date ? new Date(data.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}</Typography>
                </Box>
                <QrIcon sx={{ fontSize: 32, opacity: 0.4 }} />
            </Box>
        </Box>
    );

    // Visiting Card Preview Component
    const VisitingCardPreview = ({ data }: { data: any }) => (
        <Box sx={{ width: 350, height: 200, bgcolor: 'white', borderRadius: 2, p: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 1, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>{(data?.company_name || 'CO')[0]}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">{data?.company_name || 'Company Name'}</Typography>
                </Box>
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', lineHeight: 1.2 }}>{data?.display_name || 'Employee Name'}</Typography>
            <Typography variant="body2" color="#7c3aed" fontWeight={600}>{data?.display_designation || 'Designation'}</Typography>
            <Typography variant="caption" color="text.secondary">{data?.display_department || 'Department'}</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
                {data?.mobile_on_card && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon sx={{ fontSize: 12, color: '#7c3aed' }} /><Typography variant="caption">{data.mobile_on_card}</Typography></Box>}
                {data?.email_on_card && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><EmailIcon sx={{ fontSize: 12, color: '#7c3aed' }} /><Typography variant="caption" noWrap>{data.email_on_card}</Typography></Box>}
            </Box>
        </Box>
    );

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IdCardIcon sx={{ color: '#2563eb', fontSize: 36 }} /> ID Card & Visiting Cards
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Manage employee ID cards and visiting card requests</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForms(); setOpenDialog(true); }}
                    sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: 2, px: 3 }}>
                    {tab === 0 ? 'Issue ID Card' : 'Request Visiting Card'}
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Summary */}
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

            {/* Tabs */}
            <Paper elevation={2} sx={{ borderRadius: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab icon={<IdCardIcon />} iconPosition="start" label={`ID Cards (${idCards.length})`} />
                    <Tab icon={<VisitingCardIcon />} iconPosition="start" label={`Visiting Cards (${visitingCards.length})`} />
                </Tabs>

                {/* ID Cards Tab */}
                <TabPanel value={tab} index={0}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#eff6ff' }}>
                                        {['Employee', 'Card Number', 'Card Type', 'Issue Date', 'Expiry', 'Blood Group', 'Emergency Contact', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#1e40af' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {idCards.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                            <IdCardIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                                            <Typography color="text.secondary">No ID cards issued yet. Click "Issue ID Card" to create one.</Typography>
                                        </TableCell></TableRow>
                                    ) : idCards.map(card => (
                                        <TableRow key={card.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', fontSize: 12 }}>
                                                        {card.employee_name?.split(' ').map((n: string) => n[0]).join('')}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{card.employee_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{card.emp_code} | {card.designation_name}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography fontFamily="monospace" fontWeight={700} fontSize={12}>{card.card_number}</Typography></TableCell>
                                            <TableCell><Chip label={card.card_type?.replace('_', ' ')} size="small" color="primary" variant="outlined" /></TableCell>
                                            <TableCell>{card.issue_date ? new Date(card.issue_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                                            <TableCell>{card.expiry_date ? new Date(card.expiry_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                                            <TableCell>{card.blood_group ? <Chip label={card.blood_group} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700 }} /> : '-'}</TableCell>
                                            <TableCell>
                                                {card.emergency_contact ? <Box>
                                                    <Typography variant="body2">{card.emergency_contact}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{card.emergency_phone}</Typography>
                                                </Box> : '-'}
                                            </TableCell>
                                            <TableCell><Chip label={card.status} size="small" color={card.status === 'ACTIVE' ? 'success' : card.status === 'LOST' ? 'error' : 'default'} /></TableCell>
                                            <TableCell>
                                                <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreviewDialog({ open: true, data: { ...card, type: 'id' } })} color="info"><PreviewIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: card.id, type: 'id' })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>

                {/* Visiting Cards Tab */}
                <TabPanel value={tab} index={1}>
                    <Box sx={{ px: 2, pb: 2 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f3ff' }}>
                                        {['Employee', 'Display Name', 'Designation on Card', 'Mobile', 'Email', 'Template', 'Quantity', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#5b21b6' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visitingCards.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                            <VisitingCardIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                                            <Typography color="text.secondary">No visiting card requests yet.</Typography>
                                        </TableCell></TableRow>
                                    ) : visitingCards.map(vc => (
                                        <TableRow key={vc.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#7c3aed', fontSize: 12 }}>{vc.employee_name?.split(' ').map((n: string) => n[0]).join('')}</Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{vc.employee_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{vc.emp_code}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography fontWeight={600}>{vc.display_name}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{vc.display_designation}</Typography><Typography variant="caption" color="text.secondary">{vc.display_department}</Typography></TableCell>
                                            <TableCell>{vc.mobile_on_card || '-'}</TableCell>
                                            <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{vc.email_on_card || '-'}</Typography></TableCell>
                                            <TableCell>
                                                <Chip label={vc.card_template} size="small"
                                                    sx={{ bgcolor: cardTemplateColors[vc.card_template] + '22', color: cardTemplateColors[vc.card_template], fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>{vc.quantity_requested} pcs {vc.quantity_printed > 0 && <Typography variant="caption" color="text.secondary">({vc.quantity_printed} printed)</Typography>}</TableCell>
                                            <TableCell><Chip label={vc.status?.replace('_', ' ')} size="small" color={visitingStatusColors[vc.status]} /></TableCell>
                                            <TableCell>
                                                <Tooltip title="Preview"><IconButton size="small" color="info" onClick={() => setPreviewDialog({ open: true, data: { ...vc, type: 'vc' } })}><PreviewIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => { setEditingItem(vc); setVcForm({ employee_id: vc.employee_id, display_name: vc.display_name || '', display_designation: vc.display_designation || '', display_department: vc.display_department || '', company_name: vc.company_name || 'DKG', mobile_on_card: vc.mobile_on_card || '', email_on_card: vc.email_on_card || '', office_phone: vc.office_phone || '', website: vc.website || '', linkedin_url: vc.linkedin_url || '', address_on_card: vc.address_on_card || '', quantity_requested: vc.quantity_requested, card_template: vc.card_template, remarks: vc.remarks || '' }); setOpenDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: vc.id, type: 'vc' })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>
            </Paper>

            {/* ID Card Issue Dialog */}
            {tab === 0 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IdCardIcon /> Issue ID Card</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={12}><FormControl fullWidth required><InputLabel>Employee</InputLabel><Select value={idForm.employee_id} label="Employee" onChange={e => { setIdForm(p => ({ ...p, employee_id: e.target.value })); handleEmployeeSelect(e.target.value, 'id'); }}>{employees.map(e => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 6 }}><FormControl fullWidth><InputLabel>Card Type</InputLabel><Select value={idForm.card_type} label="Card Type" onChange={e => setIdForm(p => ({ ...p, card_type: e.target.value }))}><MenuItem value="ID_CARD">ID Card</MenuItem><MenuItem value="ACCESS_CARD">Access Card</MenuItem></Select></FormControl></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Blood Group" value={idForm.blood_group} onChange={e => setIdForm(p => ({ ...p, blood_group: e.target.value }))} placeholder="e.g. O+" /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Issue Date" type="date" value={idForm.issue_date} onChange={e => setIdForm(p => ({ ...p, issue_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Expiry Date" type="date" value={idForm.expiry_date} onChange={e => setIdForm(p => ({ ...p, expiry_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Emergency Contact Name" value={idForm.emergency_contact} onChange={e => setIdForm(p => ({ ...p, emergency_contact: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Emergency Phone" value={idForm.emergency_phone} onChange={e => setIdForm(p => ({ ...p, emergency_phone: e.target.value }))} /></Grid>
                            <Grid size={12}><TextField fullWidth multiline rows={2} label="Address" value={idForm.address} onChange={e => setIdForm(p => ({ ...p, address: e.target.value }))} /></Grid>
                            <Grid size={12}><TextField fullWidth multiline rows={2} label="Remarks" value={idForm.remarks} onChange={e => setIdForm(p => ({ ...p, remarks: e.target.value }))} /></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveIdCard} sx={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>Issue ID Card</Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Visiting Card Dialog */}
            {tab === 1 && (
                <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForms(); }} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><VisitingCardIcon /> {editingItem ? 'Update Visiting Card Request' : 'Request Visiting Cards'}</Box>
                        <IconButton onClick={() => { setOpenDialog(false); resetForms(); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth required><InputLabel>Employee</InputLabel><Select value={vcForm.employee_id} label="Employee" onChange={e => handleEmployeeSelect(e.target.value, 'vc')}>{employees.map(e => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Display Name on Card" value={vcForm.display_name} onChange={e => setVcForm(p => ({ ...p, display_name: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Designation on Card" value={vcForm.display_designation} onChange={e => setVcForm(p => ({ ...p, display_designation: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Department on Card" value={vcForm.display_department} onChange={e => setVcForm(p => ({ ...p, display_department: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Company Name" value={vcForm.company_name} onChange={e => setVcForm(p => ({ ...p, company_name: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Mobile on Card" value={vcForm.mobile_on_card} onChange={e => setVcForm(p => ({ ...p, mobile_on_card: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Email on Card" value={vcForm.email_on_card} onChange={e => setVcForm(p => ({ ...p, email_on_card: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Office Phone" value={vcForm.office_phone} onChange={e => setVcForm(p => ({ ...p, office_phone: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Website" value={vcForm.website} onChange={e => setVcForm(p => ({ ...p, website: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="LinkedIn URL" value={vcForm.linkedin_url} onChange={e => setVcForm(p => ({ ...p, linkedin_url: e.target.value }))} /></Grid>
                            <Grid size={12}><TextField fullWidth multiline rows={2} label="Address on Card" value={vcForm.address_on_card} onChange={e => setVcForm(p => ({ ...p, address_on_card: e.target.value }))} /></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth><InputLabel>Card Template</InputLabel><Select value={vcForm.card_template} label="Card Template" onChange={e => setVcForm(p => ({ ...p, card_template: e.target.value }))}><MenuItem value="STANDARD">Standard</MenuItem><MenuItem value="PREMIUM">Premium</MenuItem><MenuItem value="EXECUTIVE">Executive</MenuItem><MenuItem value="DIGITAL">Digital</MenuItem></Select></FormControl></Grid>
                            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth type="number" label="Quantity Required" value={vcForm.quantity_requested} onChange={e => setVcForm(p => ({ ...p, quantity_requested: parseInt(e.target.value) || 100 }))} /></Grid>
                            <Grid size={12}><TextField fullWidth multiline rows={2} label="Remarks / Special Instructions" value={vcForm.remarks} onChange={e => setVcForm(p => ({ ...p, remarks: e.target.value }))} /></Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => { setOpenDialog(false); resetForms(); }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveVc} sx={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                            {editingItem ? 'Update Request' : 'Submit Request'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Preview Dialog */}
            <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, data: null })} maxWidth="sm">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    Card Preview
                    <IconButton onClick={() => setPreviewDialog({ open: false, data: null })}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    {previewDialog.data?.type === 'id' ? <IdCardPreview data={previewDialog.data} /> : <VisitingCardPreview data={previewDialog.data} />}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: 0, type: '' })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this card record?</Typography></DialogContent>
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

export default CardManagementForm;
