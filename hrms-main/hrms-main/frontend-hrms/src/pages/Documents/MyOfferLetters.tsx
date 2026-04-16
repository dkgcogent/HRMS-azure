// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    CircularProgress
} from '@mui/material';
import {
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface OfferLetter {
    id: number;
    candidate_name: string;
    designation: string;
    generated_date: string;
    status: 'Sent' | 'Viewed' | 'Accepted';
    pdf_path: string;
}

const MyOfferLetters: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);

    const fetchMyOfferLetters = async () => {
        if (!user?.employeeId) return;
        try {
            setLoading(true);
            const apiUrl = process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:3004'}`;
            const response = await axios.get(`${apiUrl}/api/offer-letters/my-letters/${user.employeeId}`);
            if (response.data.success) {
                setOfferLetters(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching my offer letters:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyOfferLetters();
    }, [user?.employeeId]);

    const handleView = async (letter: OfferLetter) => {
        const apiUrl = process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:3004'}`;
        const filename = letter.pdf_path.split(/[/\\]/).pop();
        if (filename) {
            const pdfUrl = `${apiUrl}/uploads/pdfs/${filename}`;
            window.open(pdfUrl, '_blank');

            // Update status to Viewed if it's currently Sent
            if (letter.status === 'Sent') {
                try {
                    await axios.put(`${apiUrl}/api/offer-letters/${letter.id}/status`, {
                        status: 'Viewed'
                    });
                    // Optimized: update local state instead of full refetch if possible
                    // but for simplicity and correctness, refetch
                    fetchMyOfferLetters();
                } catch (error) {
                    console.error('Error updating status to Viewed:', error);
                }
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Sent': return 'primary';
            case 'Viewed': return 'info';
            case 'Accepted': return 'success';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    My Appointment Letters
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    View and download your official appointment letters from Cogent Logistics.
                </Typography>
            </Box>

            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'primary.main' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>S.No</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Offer Letter Title</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Date Received</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={40} thickness={4} />
                                        <Typography sx={{ mt: 2 }} color="text.secondary">Loading your offer letters...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : offerLetters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ opacity: 0.5 }}>
                                            <ViewIcon sx={{ fontSize: 48, mb: 1 }} />
                                            <Typography variant="h6">No offer letters found</Typography>
                                            <Typography variant="body2">When you receive an offer letter, it will appear here.</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                offerLetters.map((letter, index) => (
                                    <TableRow key={letter.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            Offer Letter - {letter.designation}
                                        </TableCell>
                                        <TableCell>{new Date(letter.generated_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={letter.status === 'Sent' ? 'New' : letter.status}
                                                color={getStatusColor(letter.status) as any}
                                                size="small"
                                                variant={letter.status === 'Sent' ? 'filled' : 'outlined'}
                                                sx={{ fontWeight: 'bold', minWidth: '80px' }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<ViewIcon />}
                                                onClick={() => handleView(letter)}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 2,
                                                    boxShadow: 2
                                                }}
                                            >
                                                View / Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default MyOfferLetters;
