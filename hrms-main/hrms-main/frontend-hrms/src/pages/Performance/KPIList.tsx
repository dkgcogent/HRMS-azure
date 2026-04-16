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
  TextField,
  IconButton,
  Grid,
} from '@mui/material';
import { ResponsiveDropdown } from '../../components/Common';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CSVExportButton from '../../components/CSVExportButton';
import PDFDownloadButton from '../../components/PDFDownloadButton';

interface KPI {
  id: number;
  employee_id: string;
  employee_name: string;
  period_year: number;
  period_month: number;
  category_name: string;
  status: string;
  submitted_at?: string;
  completed_at?: string;
}

const KPIList: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadKPIs();
  }, [statusFilter]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/kpi`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        // Transform the data to match our interface
        const transformedKPIs = result.data.map((kpi: any) => ({
          id: kpi.id,
          employee_id: kpi.employee_code || kpi.employee_id || 'N/A',
          employee_name: `${kpi.first_name || ''} ${kpi.last_name || ''}`.trim() || 'Unknown',
          period_year: kpi.period_year,
          period_month: kpi.period_month,
          category_name: kpi.category_name || 'N/A',
          status: kpi.status,
          submitted_at: kpi.submitted_at,
          completed_at: kpi.completed_at,
        }));
        setKpis(transformedKPIs);
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'SUBMITTED':
      case 'HR_REVIEW':
      case 'ADMIN_REVIEW':
      case 'MANAGER_REVIEW':
      case 'DEPT_HEAD_REVIEW':
      case 'CEO_APPROVAL':
        return 'warning';
      case 'RETURNED_FOR_CHANGES':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || `Month ${month}`;
  };

  const filteredKPIs = kpis.filter(kpi => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (kpi.employee_name || '').toLowerCase().includes(searchLower) ||
      (kpi.employee_id || '').toLowerCase().includes(searchLower) ||
      (kpi.category_name || '').toLowerCase().includes(searchLower);
    const matchesStatus = !statusFilter || kpi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            KPI List
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all KPI records submitted by employees
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <CSVExportButton
            exportType="KPI"
            variant="outlined"
            color="primary"
          />
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <ResponsiveDropdown
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'MANAGER_REVIEW', label: 'Manager Review' },
                { value: 'DEPT_HEAD_REVIEW', label: 'Dept Head Review' },
                { value: 'HR_REVIEW', label: 'HR Review' },
                { value: 'CEO_APPROVAL', label: 'CEO Approval' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'RETURNED_FOR_CHANGES', label: 'Returned' },
              ]}
              fullWidth
              placeholder="All Statuses"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Employee Name</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredKPIs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No KPIs found
                </TableCell>
              </TableRow>
            ) : (
              filteredKPIs.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell>{kpi.employee_id}</TableCell>
                  <TableCell>{kpi.employee_name}</TableCell>
                  <TableCell>
                    {getMonthName(kpi.period_month)} {kpi.period_year}
                  </TableCell>
                  <TableCell>{kpi.category_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={kpi.status.replace(/_/g, ' ')}
                      color={getStatusColor(kpi.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {kpi.submitted_at
                      ? new Date(kpi.submitted_at).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {kpi.completed_at
                      ? new Date(kpi.completed_at).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/performance/kpi/${kpi.id}`)}
                        title="View KPI"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/performance/kpi/edit/${kpi.id}`)}
                        title="Edit KPI"
                      >
                        <EditIcon />
                      </IconButton>
                      {kpi.status === 'COMPLETED' && (
                        <PDFDownloadButton
                          moduleType="KPI"
                          recordId={kpi.id}
                          fileName={`KPI_${kpi.employee_name}_${kpi.period_year}_${String(kpi.period_month).padStart(2, '0')}.pdf`}
                          variant="text"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
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

export default KPIList;

