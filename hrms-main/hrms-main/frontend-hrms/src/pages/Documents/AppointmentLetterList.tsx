// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, getPublicUrl } from '../../services/api';

interface AppointmentLetter {
    id: number;
    candidate_name: string;
    designation: string;
    generated_date: string;
    joining_date: string;
    status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted';
    pdf_path: string;
    employee_id: number | null;
    monthly_ctc: number;
    yearly_ctc: number;
    appointment_data?: string | any;
}

const AppointmentLetterList: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [letters, setLetters] = useState<AppointmentLetter[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);

    const getReferenceNumber = (letter: AppointmentLetter) => {
        if (!letter.appointment_data) return '-';
        try {
            const parsed = typeof letter.appointment_data === 'string'
                ? JSON.parse(letter.appointment_data)
                : letter.appointment_data;
            return parsed.referenceNumber || '-';
        } catch (e) {
            return '-';
        }
    };

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<AppointmentLetter | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | string>('');

    useEffect(() => {
        fetchAppointmentLetters();
        fetchEmployees();
    }, []);

    const fetchAppointmentLetters = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/appointment-letters/list`);
            if (response.data.success) {
                setLetters(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching appointment letters:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/employees`);
            if (response.data.success) {
                setEmployees(response.data.data.content || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleView = (path: string) => {
        if (!path) {
            alert('PDF path not available');
            return;
        }
        if (path.startsWith('http')) {
            window.open(path, '_blank');
        } else {
            const filename = path.split(/[/\\]/).pop();
            if (filename) {
                const pdfUrl = getPublicUrl(`/uploads/pdfs/${filename}`);
                window.open(pdfUrl, '_blank');
            } else {
                alert('Invalid PDF path');
            }
        }
    };

    const handleDownload = async (path: string, candidateName: string) => {
        if (!path) {
            alert('PDF path not available');
            return;
        }
        try {
            const url = path.startsWith('http') ? path : getPublicUrl(`/uploads/pdfs/${path.split(/[/\\]/).pop()}`);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `Appointment_Letter_${candidateName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            const url = path.startsWith('http') ? path : getPublicUrl(`/uploads/pdfs/${path.split(/[/\\]/).pop()}`);
            window.open(url, '_blank');
        }
    };

    const handleDeleteClick = (id: number) => {
        setIdToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (idToDelete) {
            try {
                await axios.delete(`${API_BASE_URL}/api/appointment-letters/${idToDelete}`);
                fetchAppointmentLetters();
            } catch (error) {
                console.error('Error deleting letter:', error);
                alert('Failed to delete letter');
            }
        }
        setDeleteDialogOpen(false);
        setIdToDelete(null);
    };

    const handleSendClick = (letter: AppointmentLetter) => {
        setSelectedLetter(letter);
        setSelectedEmployeeId(letter.employee_id || '');
        setSendDialogOpen(true);
    };

    const handleSendConfirm = async () => {
        if (!selectedLetter || !selectedEmployeeId) {
            alert('Please select an employee');
            return;
        }

        try {
            setLoading(true);
            await axios.put(`${API_BASE_URL}/api/appointment-letters/${selectedLetter.id}/status`, {
                status: 'Sent',
                employeeId: selectedEmployeeId
            });
            setSendDialogOpen(false);
            fetchAppointmentLetters();
        } catch (error) {
            console.error('Error sending letter:', error);
            alert('Failed to assign letter');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'default';
            case 'Sent': return 'primary';
            case 'Viewed': return 'info';
            case 'Accepted': return 'success';
            default: return 'default';
        }
    };

    const filteredLetters = letters.filter(letter =>
        letter.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        letter.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Appointment Letters
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/documents/appointment-letter/new')}
                    sx={{
                        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                        color: 'white',
                    }}
                >
                    Generate Appointment Letter
                </Button>
            </Box>

            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search by candidate name or designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                />
            </Paper>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f7ff' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>S.No</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Reference Number</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Employee Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Appointment Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Yearly CTC</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : filteredLetters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary">No appointment letters found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLetters.map((letter, index) => (
                                <TableRow key={letter.id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#1e3c72' }}>{getReferenceNumber(letter)}</TableCell>
                                    <TableCell sx={{ minWidth: 200 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {letter.candidate_name}
                                            </Typography>
                                            {letter.employee_id && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Assigned to: {(() => {
                                                        const emp = employees.find(e => e.id === letter.employee_id);
                                                        return emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeId})` : `Employee ID: ${letter.employee_id}`;
                                                    })()}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{letter.designation}</TableCell>
                                    <TableCell>{letter.joining_date && !isNaN(new Date(letter.joining_date).getTime()) ? new Date(letter.joining_date).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>₹ {Number(letter.yearly_ctc || 0).toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={letter.status}
                                            color={getStatusColor(letter.status) as any}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="View PDF">
                                            <IconButton size="small" color="primary" onClick={() => handleView(letter.pdf_path)}>
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download PDF">
                                            <IconButton size="small" sx={{ color: '#0288d1' }} onClick={() => handleDownload(letter.pdf_path, letter.candidate_name)}>
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {(letter.status === 'Draft' || letter.status === 'Sent' || letter.status === 'Viewed') && (
                                            <Tooltip title="Assign to Employee">
                                                <IconButton size="small" color="success" onClick={() => handleSendClick(letter)}>
                                                    <SendIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDeleteClick(letter.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this appointment letter? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Dialog */}
            <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Assign Appointment Letter</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Select the employee who should receive this appointment letter.
                    </DialogContentText>
                    <FormControl fullWidth required>
                        <InputLabel id="assign-emp-label">Employee</InputLabel>
                        <Select
                            labelId="assign-emp-label"
                            value={selectedEmployeeId}
                            label="Employee"
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        >
                            {employees.map((emp) => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSendConfirm} color="primary" variant="contained">
                        Assign & Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AppointmentLetterList;
