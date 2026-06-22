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
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as ViewIcon, Download as DownloadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService, Payslip, Employee, API_BASE_URL } from '../../services/api';

const PayslipList: React.FC = () => {
    const navigate = useNavigate();
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [payslipRes, empRes] = await Promise.all([
                apiService.getPayslips(),
                apiService.getEmployees(0, 500)
            ]);

            if (payslipRes.success && payslipRes.data) {
                setPayslips(payslipRes.data);
            }

            if (empRes.success && empRes.data?.content) {
                setEmployees(empRes.data.content);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEmployeeName = (employeeId: number) => {
        const emp = employees.find(e => e.id === employeeId);
        return emp ? `${emp.firstName} ${emp.lastName}` : `Employee ${employeeId}`;
    };

    const getMonthName = (month: number) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1] || month;
    };

    const handleView = (payslipId: number) => {
        window.open(`${API_BASE_URL}/api/payroll/${payslipId}/pdf`, '_blank');
    };

    const handleDownload = async (payslipId: number, employeeId: number, month: number, year: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/payroll/${payslipId}/pdf`);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const empName = getEmployeeName(employeeId);
            a.download = `Payslip_${empName}_${month}_${year}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    const handleDelete = async (payslipId: number) => {
        if (window.confirm('Are you sure you want to delete this payslip?')) {
            try {
                await apiService.deletePayslip(payslipId);
                fetchData();
            } catch (error) {
                console.error('Error deleting payslip:', error);
                alert('Failed to delete payslip. Please try again.');
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Payslip Management
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/payslips/create')}
                >
                    Generate Payslip
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Employee Name</strong></TableCell>
                            <TableCell><strong>Month/Year</strong></TableCell>
                            <TableCell><strong>Gross Salary</strong></TableCell>
                            <TableCell><strong>Net Salary</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">Loading payslips...</TableCell>
                            </TableRow>
                        ) : payslips.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No payslips found.</TableCell>
                            </TableRow>
                        ) : (
                            payslips.map((payslip) => (
                                <TableRow key={payslip.id} hover>
                                    <TableCell>{payslip.id}</TableCell>
                                    <TableCell>{getEmployeeName(payslip.employee_id)}</TableCell>
                                    <TableCell>{getMonthName(payslip.month)} {payslip.year}</TableCell>
                                    <TableCell>₹{payslip.gross_salary?.toLocaleString()}</TableCell>
                                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                        ₹{payslip.net_salary?.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="View Payslip">
                                            <IconButton
                                                color="info"
                                                onClick={() => handleView(payslip.id!)}
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download Payslip">
                                            <IconButton
                                                color="success"
                                                onClick={() => handleDownload(payslip.id!, payslip.employee_id, payslip.month, payslip.year)}
                                            >
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Payslip">
                                            <IconButton
                                                color="primary"
                                                onClick={() => navigate(`/payslips/edit/${payslip.id}`)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Payslip">
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(payslip.id!)}
                                            >
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
        </Box>
    );
};

export default PayslipList;
