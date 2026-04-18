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
    Menu,
    MenuItem,
    ListItemIcon,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Send as SendIcon,
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import { API_BASE_URL, getPublicUrl } from '../../services/api';

interface OfferLetter {
    id: number;
    candidate_name: string;
    designation: string;
    generated_date: string;
    status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted';
    pdf_path: string;
    employee_id: number | null;
    monthly_ctc: number;
    yearly_ctc: number;
}

const OfferLetterList: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<OfferLetter | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | string>('');
    const [employees, setEmployees] = useState<any[]>([]);

    // Fetch offer letters
    const fetchOfferLetters = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/offer-letters/list`);
            if (response.data.success) {
                setOfferLetters(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching offer letters:', error);
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

    useEffect(() => {
        fetchOfferLetters();
        fetchEmployees();
    }, []);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setAnchorEl(event.currentTarget);
        setSelectedId(id);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedId(null);
    };

    const handleView = (path: string) => {
        if (!path) {
            alert('PDF path not available');
            return;
        }
        const filename = path.split(/[/\\]/).pop();
        if (filename) {
            const pdfUrl = getPublicUrl(`/uploads/pdfs/${filename}`);
            window.open(pdfUrl, '_blank');
        } else {
            alert('Invalid PDF path');
        }
        handleMenuClose();
    };

    const handleDeleteClick = (id: number) => {
        setIdToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (idToDelete) {
            try {
                await axios.delete(`${API_BASE_URL}/api/offer-letters/${idToDelete}`);
                fetchOfferLetters();
            } catch (error) {
                console.error('Error deleting offer letter:', error);
                alert('Failed to delete offer letter');
            }
        }
        setDeleteDialogOpen(false);
        setIdToDelete(null);
    };

    const handleEdit = (id: number) => {
        console.log('Edit clicked for', id);
        handleMenuClose();
    };

    const handleSendClick = (letter: OfferLetter) => {
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
            await axios.put(`${API_BASE_URL}/api/offer-letters/${selectedLetter.id}/status`, {
                status: 'Sent',
                employeeId: selectedEmployeeId
            });
            setSendDialogOpen(false);
            fetchOfferLetters();
        } catch (error) {
            console.error('Error sending offer letter:', error);
            alert('Failed to send offer letter');
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

    const filteredLetters = offerLetters.filter(letter =>
        letter.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        letter.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Offer Letters
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/documents/offer-letter/new')}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                    }}
                >
                    Generate Offer Letter
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
                            <TableCell sx={{ fontWeight: 'bold' }}>Employee Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Generated Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : filteredLetters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary">No offer letters found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLetters.map((letter, index) => (
                                <TableRow key={letter.id} hover>
                                    <TableCell>{index + 1}</TableCell>
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
                                    <TableCell>{new Date(letter.generated_date).toLocaleDateString()}</TableCell>
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
                                        <Tooltip title="View">
                                            <IconButton size="small" color="primary" onClick={() => handleView(letter.pdf_path)}>
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" color="info" onClick={() => handleEdit(letter.id)}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {(letter.status === 'Draft' || letter.status === 'Sent' || letter.status === 'Viewed') && (
                                            <Tooltip title={letter.status === 'Draft' ? "Send" : "Resend"}>
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this offer letter? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Send Offer Letter Dialog */}
            <Dialog
                open={sendDialogOpen}
                onClose={() => setSendDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {selectedLetter?.status === 'Draft' ? 'Send Offer Letter' : 'Resend Offer Letter'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Select the employee who should receive the offer letter for <strong>{selectedLetter?.candidate_name}</strong>.
                    </DialogContentText>
                    <TextField
                        select
                        fullWidth
                        label="Select Employee"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        SelectProps={{ native: true }}
                        InputLabelProps={{ shrink: true }}
                    >
                        <option value="">Choose an employee</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName} ({emp.employeeId})
                            </option>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSendDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendConfirm}
                        color="success"
                        variant="contained"
                        disabled={!selectedEmployeeId || loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (selectedLetter?.status === 'Draft' ? 'Send Now' : 'Resend Now')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OfferLetterList;
