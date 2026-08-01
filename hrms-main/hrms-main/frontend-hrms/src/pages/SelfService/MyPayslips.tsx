import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Visibility as ViewIcon, Download as DownloadIcon } from '@mui/icons-material';
import { apiService, Payslip, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MyPayslips: React.FC = () => {
    const { user } = useAuth();
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.employeeId) {
            fetchData(Number(user.employeeId));
        }
    }, [user]);

    const fetchData = async (employeeId: number) => {
        try {
            setLoading(true);
            const res = await apiService.getPayslipsByEmployee(employeeId);
            if (res.success && res.data) {
                setPayslips(res.data);
            }
        } catch (error) {
            console.error('Error fetching payslips:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (month: number) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1] || month;
    };

    const handleView = (payslipId: number) => {
        window.open(`${API_BASE_URL}/api/payroll/${payslipId}/pdf`, '_blank');
    };

    const handleDownload = async (payslipId: number, month: number, year: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/payroll/${payslipId}/pdf`);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `My_Payslip_${month}_${year}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    My Payslips
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    View and download your monthly payslips
                </Typography>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Month/Year</strong></TableCell>
                            <TableCell><strong>Gross Salary</strong></TableCell>
                            <TableCell><strong>Net Salary</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">Loading your payslips...</TableCell>
                            </TableRow>
                        ) : payslips.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No payslips found.</TableCell>
                            </TableRow>
                        ) : (
                            payslips.map((payslip) => (
                                <TableRow key={payslip.id} hover>
                                    <TableCell>{getMonthName(payslip.month)} {payslip.year}</TableCell>
                                    <TableCell>₹{payslip.gross_salary?.toLocaleString()}</TableCell>
                                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                        ₹{payslip.net_salary?.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="View Payslip">
                                            <IconButton color="info" onClick={() => handleView(payslip.id!)}>
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download Payslip">
                                            <IconButton color="success" onClick={() => handleDownload(payslip.id!, payslip.month, payslip.year)}>
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MyPayslips;
