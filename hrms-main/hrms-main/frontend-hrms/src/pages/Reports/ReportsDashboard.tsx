import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  DateRange as DateRangeIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  category: 'employee' | 'master' | 'analytics' | 'compliance';
  route: string;
  filters?: string[];
}

const ReportsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDialog, setPreviewDialog] = useState({ open: false, reportId: '', title: '' });

  const reportConfigs: ReportConfig[] = [
    // Employee Reports
    {
      id: 'employee-list',
      title: 'Employee Master Report',
      description: 'Complete list of all employees with personal and official details',
      icon: <PeopleIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      category: 'employee',
      route: '/reports/employee-list',
      filters: ['department', 'designation', 'status', 'manpowerType']
    },
    {
      id: 'employee-summary',
      title: 'Employee Summary Report',
      description: 'Statistical summary of employees by department, designation, and status',
      icon: <BarChartIcon />,
      color: '#388e3c',
      bgColor: '#e8f5e8',
      category: 'employee',
      route: '/reports/employee-summary'
    },
    {
      id: 'new-joiners',
      title: 'New Joiners Report',
      description: 'List of employees who joined within a specific date range',
      icon: <TrendingUpIcon />,
      color: '#f57c00',
      bgColor: '#fff3e0',
      category: 'employee',
      route: '/reports/new-joiners',
      filters: ['dateRange', 'department']
    },
    {
      id: 'department-wise',
      title: 'Department-wise Employee Report',
      description: 'Employee distribution and details grouped by departments',
      icon: <BusinessIcon />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
      category: 'employee',
      route: '/reports/department-wise'
    },

    // Master Data Reports
    {
      id: 'master-data-summary',
      title: 'Master Data Summary',
      description: 'Complete overview of all master data configurations',
      icon: <TableChartIcon />,
      color: '#d32f2f',
      bgColor: '#ffebee',
      category: 'master',
      route: '/reports/master-data-summary'
    },
    {
      id: 'department-designation',
      title: 'Department & Designation Report',
      description: 'Hierarchical view of departments and their designations',
      icon: <BusinessIcon />,
      color: '#0288d1',
      bgColor: '#e1f5fe',
      category: 'master',
      route: '/reports/department-designation'
    },

    // Analytics Reports
    {
      id: 'employee-analytics',
      title: 'Employee Analytics Dashboard',
      description: 'Visual analytics with charts and graphs for employee data',
      icon: <PieChartIcon />,
      color: '#5d4037',
      bgColor: '#efebe9',
      category: 'analytics',
      route: '/reports/employee-analytics'
    },
    {
      id: 'growth-trends',
      title: 'Growth Trends Report',
      description: 'Employee growth trends and hiring patterns over time',
      icon: <TrendingUpIcon />,
      color: '#00796b',
      bgColor: '#e0f2f1',
      category: 'analytics',
      route: '/reports/growth-trends',
      filters: ['dateRange']
    },

    // Compliance Reports
    {
      id: 'document-compliance',
      title: 'Document Compliance Report',
      description: 'Employee document submission status and compliance tracking',
      icon: <TableChartIcon />,
      color: '#c2185b',
      bgColor: '#fce4ec',
      category: 'compliance',
      route: '/reports/document-compliance'
    },
    {
      id: 'data-audit',
      title: 'Data Audit Report',
      description: 'Audit trail of data changes and system activities',
      icon: <ReportsIcon />,
      color: '#455a64',
      bgColor: '#eceff1',
      category: 'compliance',
      route: '/reports/data-audit',
      filters: ['dateRange', 'activityType']
    }
  ];

  const categories = [
    { value: 'all', label: 'All Reports', count: reportConfigs.length },
    { value: 'employee', label: 'Employee Reports', count: reportConfigs.filter(r => r.category === 'employee').length },
    { value: 'master', label: 'Master Data', count: reportConfigs.filter(r => r.category === 'master').length },
    { value: 'analytics', label: 'Analytics', count: reportConfigs.filter(r => r.category === 'analytics').length },
    { value: 'compliance', label: 'Compliance', count: reportConfigs.filter(r => r.category === 'compliance').length },
  ];

  const filteredReports = reportConfigs.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateReport = (reportId: string) => {
    const report = reportConfigs.find(r => r.id === reportId);
    if (report) {
      navigate(report.route);
    }
  };

  const handlePreviewReport = (reportId: string, title: string) => {
    setPreviewDialog({ open: true, reportId, title });
  };

  const handleExportReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoading(true);
      // This would call the backend API to generate and download the report
      setSnackbar({ 
        open: true, 
        message: `${format.toUpperCase()} export started. Download will begin shortly.`, 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to export report', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReportsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Reports & Analytics
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label} ({category.count})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          <Typography variant="body2" color="text.secondary">
            {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>
      </Paper>

      {/* Reports Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
        {filteredReports.map((report) => (
          <Box key={report.id}>
            <Card 
              elevation={2}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: report.bgColor,
                      color: report.color,
                      mr: 2
                    }}
                  >
                    {report.icon}
                  </Box>
                  <Chip 
                    label={report.category} 
                    size="small" 
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {report.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {report.description}
                </Typography>

                {report.filters && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {report.filters.map((filter) => (
                      <Chip 
                        key={filter} 
                        label={filter} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => handleGenerateReport(report.id)}
                  sx={{ backgroundColor: report.color }}
                >
                  Generate
                </Button>
                
                <Box>
                  <Tooltip title="Preview Report">
                    <IconButton 
                      size="small"
                      onClick={() => handlePreviewReport(report.id, report.title)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export as PDF">
                    <IconButton 
                      size="small"
                      onClick={() => handleExportReport(report.id, 'pdf')}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Print Report">
                    <IconButton 
                      size="small"
                      onClick={() => handleExportReport(report.id, 'pdf')}
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {filteredReports.length === 0 && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <ReportsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No reports found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or category filter
          </Typography>
        </Paper>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, reportId: '', title: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewDialog.title} - Preview</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Report preview functionality will be implemented here.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This would show a sample of the report data and formatting.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, reportId: '', title: '' })}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => handleGenerateReport(previewDialog.reportId)}
          >
            Generate Full Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsDashboard;
