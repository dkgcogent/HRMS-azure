import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService, Employee, Department, Designation, ManpowerType } from '../../services/api';

interface AnalyticsData {
  departmentDistribution: { name: string; count: number; percentage: number }[];
  designationDistribution: { name: string; count: number; percentage: number }[];
  manpowerTypeDistribution: { name: string; count: number; percentage: number }[];
  monthlyJoining: { month: string; count: number }[];
  totalEmployees: number;
  activeEmployees: number;
  averageAge: number;
  genderDistribution: { male: number; female: number; other: number };
}

const EmployeeAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedChart, setSelectedChart] = useState('department');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load employee data and calculate analytics
      const employeesRes = await apiService.getEmployees();
      const departmentsRes = await apiService.getDepartments();
      const designationsRes = await apiService.getDesignations();
      const manpowerTypesRes = await apiService.getManpowerTypes();

      const employees = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data?.content || []);
      const departments = departmentsRes.data || [];
      const designations = designationsRes.data || [];
      const manpowerTypes = manpowerTypesRes.data || [];

      // Calculate department distribution
      const departmentCounts = departments.map((dept: Department) => {
        const count = employees.filter((emp: Employee) => emp.department?.id === dept.id).length;
        return {
          name: dept.name,
          count,
          percentage: employees.length > 0 ? (count / employees.length) * 100 : 0
        };
      });

      // Calculate designation distribution
      const designationCounts = designations.map((desig: Designation) => {
        const count = employees.filter((emp: Employee) => emp.designation?.id === desig.id).length;
        return {
          name: desig.name,
          count,
          percentage: employees.length > 0 ? (count / employees.length) * 100 : 0
        };
      });

      // Calculate manpower type distribution
      const manpowerTypeCounts = manpowerTypes.map((type: ManpowerType) => {
        const count = employees.filter((emp: Employee) => emp.manpowerType?.id === type.id).length;
        return {
          name: type.name,
          count,
          percentage: employees.length > 0 ? (count / employees.length) * 100 : 0
        };
      });

      // Calculate monthly joining trends (last 12 months)
      const monthlyJoining = [];
      const currentDate = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const count = employees.filter((emp: Employee) => {
          if (!emp.joiningDate) return false;
          const joinDate = new Date(emp.joiningDate);
          return joinDate.getMonth() === date.getMonth() && joinDate.getFullYear() === date.getFullYear();
        }).length;
        monthlyJoining.push({ month: monthName, count });
      }

      // Calculate gender distribution
      const genderDistribution = {
        male: employees.filter((emp: Employee) => emp.gender?.toLowerCase() === 'male').length,
        female: employees.filter((emp: Employee) => emp.gender?.toLowerCase() === 'female').length,
        other: employees.filter((emp: Employee) => emp.gender && !['male', 'female'].includes(emp.gender.toLowerCase())).length
      };

      // Calculate average age
      const currentYear = new Date().getFullYear();
      const employeesWithAge = employees.filter((emp: Employee) => emp.dateOfBirth);
      const averageAge = employeesWithAge.length > 0 
        ? employeesWithAge.reduce((sum: number, emp: Employee) => {
            const birthYear = new Date(emp.dateOfBirth).getFullYear();
            return sum + (currentYear - birthYear);
          }, 0) / employeesWithAge.length
        : 0;

      setAnalyticsData({
        departmentDistribution: departmentCounts,
        designationDistribution: designationCounts,
        manpowerTypeDistribution: manpowerTypeCounts,
        monthlyJoining,
        totalEmployees: employees.length,
        activeEmployees: employees.filter((emp: Employee) => emp.isActive !== false).length,
        averageAge: Math.round(averageAge),
        genderDistribution
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      setSnackbar({ open: true, message: 'Failed to load analytics data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    setSnackbar({ 
      open: true, 
      message: `${format.toUpperCase()} export started. Download will begin shortly.`, 
      severity: 'success' 
    });
  };

  const renderSimpleChart = (data: { name: string; count: number; percentage: number }[], title: string) => {
    const maxCount = Math.max(...data.map(item => item.count));
    
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon /> {title}
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {data.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  bgcolor: 'grey.200', 
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`, 
                    height: '100%', 
                    bgcolor: `hsl(${(index * 360) / data.length}, 70%, 50%)`,
                    transition: 'width 0.3s ease'
                  }} />
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderTrendChart = (data: { month: string; count: number }[]) => {
    const maxCount = Math.max(...data.map(item => item.count));
    
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon /> Monthly Joining Trends
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: 200, overflow: 'auto' }}>
            {data.map((item, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                minWidth: 60
              }}>
                <Typography variant="caption" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {item.count}
                </Typography>
                <Box sx={{ 
                  width: 40, 
                  height: `${maxCount > 0 ? (item.count / maxCount) * 150 : 0}px`,
                  bgcolor: 'primary.main',
                  borderRadius: '4px 4px 0 0',
                  minHeight: 4,
                  transition: 'height 0.3s ease'
                }} />
                <Typography variant="caption" sx={{ mt: 1, transform: 'rotate(-45deg)', fontSize: '0.7rem' }}>
                  {item.month}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No analytics data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/reports')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <AnalyticsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Employee Analytics Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
              {analyticsData.totalEmployees}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Employees
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
              {analyticsData.activeEmployees}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Employees
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold' }}>
              {analyticsData.averageAge}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Age
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
              {analyticsData.departmentDistribution.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Departments
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        {renderSimpleChart(analyticsData.departmentDistribution, 'Department Distribution')}
        {renderSimpleChart(analyticsData.designationDistribution, 'Designation Distribution')}
        {renderSimpleChart(analyticsData.manpowerTypeDistribution, 'Manpower Type Distribution')}
        {renderTrendChart(analyticsData.monthlyJoining)}
      </Box>

      {/* Gender Distribution */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ maxWidth: '600px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChartIcon /> Gender Distribution
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {analyticsData.genderDistribution.male}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Male
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                    {analyticsData.genderDistribution.female}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Female
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {analyticsData.genderDistribution.other}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Other
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

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

export default EmployeeAnalytics;
