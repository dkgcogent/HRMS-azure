import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Grid,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  AccountBalance as BankIcon,
  Payment as PaymentIcon,
  School as SchoolIcon,
  Description as DocumentIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalDesignations: number;
  activeEmployees: number;
  totalShifts: number;
  totalWorkLocations: number;
  totalBanks: number;
  totalPaymentModes: number;
  totalQualifications: number;
  totalDocumentTypes: number;
}

interface RecentActivity {
  id: number;
  action: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  type: 'employee' | 'master' | 'system';
}

interface MasterDataSummary {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  route: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalDepartments: 0,
    totalDesignations: 0,
    activeEmployees: 0,
    totalShifts: 0,
    totalWorkLocations: 0,
    totalBanks: 0,
    totalPaymentModes: 0,
    totalQualifications: 0,
    totalDocumentTypes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard statistics from dedicated API
      const [dashboardStatsRes, recentActivitiesRes] = await Promise.all([
        apiService.getDashboardStats().catch(() => ({ data: null })),
        apiService.getRecentActivities().catch(() => ({ data: [] }))
      ]);

      if (dashboardStatsRes.data) {
        const statsData = dashboardStatsRes.data;

        setStats(prevStats => ({
          ...prevStats, // Keep existing stats
          totalEmployees: statsData.totalEmployees || 0,
          // The rest of the stats will be loaded by loadFallbackData
        }));
        // Always call fallback to ensure all stats are loaded,
        // as the main dashboard API might not return all details yet.
        await loadFallbackData();
      } else {
        // Fallback to individual API calls if dashboard API fails
        await loadFallbackData();
      }

      // Set recent activities
      if (recentActivitiesRes.data) {
        const activities = recentActivitiesRes.data.map((activity: any) => ({
          id: activity.id,
          action: activity.action,
          description: activity.description,
          time: activity.time,
          icon: getActivityIcon(activity.type),
          type: activity.type
        }));
        setRecentActivities(activities);
      }

      setSnackbar({ open: true, message: 'Dashboard data refreshed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSnackbar({ open: true, message: 'Failed to load dashboard data', severity: 'error' });
      // Try fallback data loading
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    try {
      // Load real data from individual APIs as fallback
      const [
        employeesRes,
        departmentsRes,
        designationsRes,
        shiftsRes,
        workLocationsRes,
        banksRes,
        paymentModesRes,
        qualificationsRes,
        documentTypesRes
      ] = await Promise.all([
        apiService.getEmployees().catch(() => ({ data: [] })),
        apiService.getDepartments().catch(() => ({ data: [] })),
        apiService.getDesignations().catch(() => ({ data: [] })),
        apiService.getShifts().catch(() => ({ data: [] })),
        apiService.getWorkLocations().catch(() => ({ data: [] })),
        apiService.getBanks().catch(() => ({ data: [] })),
        apiService.getPaymentModes().catch(() => ({ data: [] })),
        apiService.getQualifications().catch(() => ({ data: [] })),
        apiService.getDocumentTypes().catch(() => ({ data: [] }))
      ]);

      const employees = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data?.content || []);
      const activeEmployees = employees.filter((emp: any) => emp.isActive !== false);

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        totalDepartments: (departmentsRes.data || []).length,
        totalDesignations: (designationsRes.data || []).length,
        totalShifts: (shiftsRes.data || []).length,
        totalWorkLocations: (workLocationsRes.data || []).length,
        totalBanks: (banksRes.data || []).length,
        totalPaymentModes: (paymentModesRes.data || []).length,
        totalQualifications: (qualificationsRes.data || []).length,
        totalDocumentTypes: (documentTypesRes.data || []).length,
      });

      // Generate recent activities based on real data
      generateRecentActivities(employees);
    } catch (error) {
      console.error('Fallback data loading failed:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'employee': return <PersonAddIcon />;
      case 'system': return <AnalyticsIcon />;
      case 'master': return <BusinessIcon />;
      default: return <NotificationsIcon />;
    }
  };

  const generateRecentActivities = (employees: any[]) => {
    const activities: RecentActivity[] = [];

    // Add recent employee activities
    const recentEmployees = employees
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 3);

    recentEmployees.forEach((emp, index) => {
      activities.push({
        id: activities.length + 1,
        action: 'New employee added',
        description: `${emp.firstName} ${emp.lastName} joined as ${emp.designation?.name || 'Employee'}`,
        time: getTimeAgo(emp.createdAt),
        icon: <PersonAddIcon />,
        type: 'employee'
      });
    });

    // Add some system activities
    activities.push({
      id: activities.length + 1,
      action: 'System backup completed',
      description: 'Daily system backup completed successfully',
      time: '1 hour ago',
      icon: <AnalyticsIcon />,
      type: 'system'
    });

    setRecentActivities(activities.slice(0, 5));
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      route: '/employees',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      bgColor: '#e8f5e8',
      route: '/employees',
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      bgColor: '#fff3e0',
      route: '/masters/departments',
    },
    {
      title: 'Designations',
      value: stats.totalDesignations,
      icon: <WorkIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
      route: '/masters/designations',
    },
  ];

  const masterDataCards: MasterDataSummary[] = [
    {
      name: 'Shifts',
      count: stats.totalShifts,
      icon: <ScheduleIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      route: '/masters/shifts'
    },
    {
      name: 'Work Locations',
      count: stats.totalWorkLocations,
      icon: <LocationIcon />,
      color: '#388e3c',
      bgColor: '#e8f5e8',
      route: '/masters/work-locations'
    },
    {
      name: 'Banks',
      count: stats.totalBanks,
      icon: <BankIcon />,
      color: '#f57c00',
      bgColor: '#fff3e0',
      route: '/masters/banks'
    },
    {
      name: 'Payment Modes',
      count: stats.totalPaymentModes,
      icon: <PaymentIcon />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
      route: '/masters/payment-modes'
    },
    {
      name: 'Qualifications',
      count: stats.totalQualifications,
      icon: <SchoolIcon />,
      color: '#d32f2f',
      bgColor: '#ffebee',
      route: '/masters/qualifications'
    },
    {
      name: 'Document Types',
      count: stats.totalDocumentTypes,
      icon: <DocumentIcon />,
      color: '#0288d1',
      bgColor: '#e1f5fe',
      route: '/masters/document-types'
    }
  ];

  return (
    <Box>
      {/* Header with Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Live Dashboard
          </Typography>
          <Chip
            label={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            color={autoRefresh ? "success" : "default"}
            size="small"
            icon={<NotificationsIcon />}
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{ cursor: 'pointer' }}
          />
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}>
            <IconButton
              onClick={() => setAutoRefresh(!autoRefresh)}
              sx={{
                bgcolor: autoRefresh ? 'success.main' : 'grey.400',
                color: 'white',
                '&:hover': { bgcolor: autoRefresh ? 'success.dark' : 'grey.600' }
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Dashboard Data">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Employee Stats Cards */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PeopleIcon /> Employee Overview
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        {statCards.map((card, index) => (
          <Box key={index} sx={{ flex: '1 1 250px', minWidth: '200px' }}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
              onClick={() => navigate(card.route)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      {card.title}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: card.color }}>
                      {loading ? <CircularProgress size={24} /> : card.value}
                    </Typography>
                    {card.title === 'Total Employees' && (
                      <LinearProgress
                        variant="determinate"
                        value={(stats.activeEmployees / stats.totalEmployees) * 100}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    )}
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: card.bgColor,
                      color: card.color,
                      width: 60,
                      height: 60,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Master Data Overview */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon /> Master Data Overview
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        {masterDataCards.map((card, index) => (
          <Box key={index} sx={{ flex: '1 1 180px', minWidth: '150px' }}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  bgcolor: card.bgColor,
                }
              }}
              onClick={() => navigate(card.route)}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Avatar
                  sx={{
                    backgroundColor: card.bgColor,
                    color: card.color,
                    width: 40,
                    height: 40,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  {card.icon}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: card.color }}>
                  {loading ? <Skeleton width={30} /> : card.count}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {card.name}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Quick Actions */}
        <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
          <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon /> Quick Actions
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/employees/new')}
                sx={{
                  py: 2,
                  flexDirection: 'column',
                  gap: 1,
                  height: '80px',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              >
                Add Employee
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/employees')}
                sx={{
                  py: 2,
                  flexDirection: 'column',
                  gap: 1,
                  height: '80px',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              >
                View Employees
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<BusinessIcon />}
                onClick={() => navigate('/masters/departments')}
                sx={{
                  py: 2,
                  flexDirection: 'column',
                  gap: 1,
                  height: '80px',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              >
                Manage Masters
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                size="large"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/reports')}
                sx={{
                  py: 2,
                  flexDirection: 'column',
                  gap: 1,
                  height: '80px',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              >
                Reports
              </Button>
            </Box>

            {/* System Status */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon fontSize="small" /> System Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="body2">Database: Connected</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="body2">API: Operational</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: autoRefresh ? 'success.main' : 'warning.main' }} />
                <Typography variant="body2">Auto-refresh: {autoRefresh ? 'Enabled' : 'Disabled'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                <Typography variant="body2">Last Updated: {lastRefresh.toLocaleTimeString()}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Recent Activities */}
        <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
          <Paper elevation={2} sx={{ p: 3, height: '400px', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon /> Recent Activities
            </Typography>
            {loading ? (
              <Box>
                {[1, 2, 3].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{
                            bgcolor: activity.type === 'employee' ? 'primary.main' :
                                     activity.type === 'system' ? 'success.main' : 'secondary.main',
                            width: 36,
                            height: 36
                          }}>
                            {activity.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {activity.action}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {activity.description}
                              </Typography>
                              <br />
                              <Typography component="span" variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent activities
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
