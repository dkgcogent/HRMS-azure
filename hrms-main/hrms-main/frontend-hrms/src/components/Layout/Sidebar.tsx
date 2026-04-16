// @ts-nocheck
import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  Box,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Person as PersonIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  AccountBalance as BankIcon,
  School as SchoolIcon,
  Description as DocumentIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Assessment as AppraisalIcon,
  Computer as AssetIcon,
  Assignment as TaskIcon,
  TrendingUp as PromotionIcon,
  LocalHospital as BenefitsIcon,
  Notifications as NotificationIcon,
  AccountCircle as ProfileIcon,
  ChevronRight as ChevronRightIcon,
  EmojiEvents as AwardIcon,
  Gavel as ComplianceIcon,
  School as TrainingIcon,
  Badge as CardIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mastersOpen, setMastersOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  const handleMastersClick = () => {
    setMastersOpen(!mastersOpen);
  };

  const handleAttendanceClick = () => {
    setAttendanceOpen(!attendanceOpen);
  };

  const getEmployeeProfilePath = () => {
    // Priority: user object from context > localStorage > default 1
    const employeeId = user?.employeeId || localStorage.getItem('employeeId') || '1';
    return `/employees/${employeeId}/profile`;
  };

  const allMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['hr', 'admin'] },
    { text: 'Employees', icon: <PeopleIcon />, path: '/employees', roles: ['hr', 'admin'] },
    { text: 'HR KPI Review', icon: <AppraisalIcon />, path: '/performance/hr-review', roles: ['hr'] },
    { text: 'Admin KPI Review', icon: <AppraisalIcon />, path: '/performance/manager-review', roles: ['admin'] },
    { text: 'KPI List', icon: <AppraisalIcon />, path: '/performance/kpi-list', roles: ['admin'] },
    { text: 'Assets', icon: <AssetIcon />, path: '/assets', roles: ['hr', 'admin'] },
    { text: 'Tasks', icon: <TaskIcon />, path: '/tasks/hr', roles: ['hr'] },
    { text: 'Tasks', icon: <TaskIcon />, path: '/tasks/admin', roles: ['admin'] },
    { text: 'My Tasks', icon: <TaskIcon />, path: '/tasks/my', roles: ['employee'] },
    { text: 'Promotions', icon: <PromotionIcon />, path: '/promotions', roles: ['admin'] },
    { text: 'Training', icon: <TrainingIcon />, path: '/training', roles: ['hr', 'admin'] },
    { text: 'Awards & Certifications', icon: <AwardIcon />, path: '/awards', roles: ['admin'] },
    { text: 'Compliance (ESI/PF)', icon: <ComplianceIcon />, path: '/compliance', roles: ['admin'] },
    { text: 'ID & Visiting Cards', icon: <CardIcon />, path: '/cards', roles: ['admin'] },
    { text: 'Benefits', icon: <BenefitsIcon />, path: '/benefits/insurance', roles: ['admin'] },
    { text: 'Notifications', icon: <NotificationIcon />, path: '/communication/notifications', roles: ['admin'] },
    { text: 'Offer Letter', icon: <DocumentIcon />, path: '/documents/offer-letter', roles: ['admin'] },
    { text: 'Payslip', icon: <PaymentIcon />, path: '/payslips', roles: ['admin'] },
    { text: 'Appointment Letter', icon: <DocumentIcon />, path: '/documents/my-offer-letter', roles: ['employee'] },
    { text: 'My Attendance', icon: <ScheduleIcon />, path: '/attendance', roles: ['employee', 'hr'] },
    { text: 'My KPI', icon: <AppraisalIcon />, path: '/performance/kpi/create', roles: ['employee', 'hr'] },
    { text: 'My Profile', icon: <ProfileIcon />, path: '/profile', roles: ['employee', 'hr'] },
  ];

  const role = user?.role || 'employee';
  const menuItems = allMenuItems.filter(item => item.roles.includes(role as any));

  const masterItems = [
    { text: 'Manpower Types', icon: <PersonIcon />, path: '/masters/manpower-types' },
    { text: 'Departments', icon: <BusinessIcon />, path: '/masters/departments' },
    { text: 'Designations', icon: <WorkIcon />, path: '/masters/designations' },
    { text: 'Shifts', icon: <ScheduleIcon />, path: '/masters/shifts' },
    { text: 'Work Locations', icon: <LocationIcon />, path: '/masters/work-locations' },
    { text: 'Banks', icon: <BankIcon />, path: '/masters/banks' },
    { text: 'Payment Modes', icon: <PaymentIcon />, path: '/masters/payment-modes' },
    { text: 'Qualifications', icon: <SchoolIcon />, path: '/masters/qualifications' },
    { text: 'Document Types', icon: <DocumentIcon />, path: '/masters/document-types' },
    { text: 'Customers', icon: <PersonIcon />, path: '/masters/customers' },
    { text: 'Projects', icon: <WorkIcon />, path: '/masters/projects' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.5px',
            mb: 0.5,
          }}
        >
          HRMS
        </Typography>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.9,
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
          }}
        >
          Human Resource Management
        </Typography>
      </Box>

      {/* User Profile Section */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'User'}
            </Typography>
            <Chip
              label={role.charAt(0).toUpperCase() + role.slice(1)}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                mt: 0.5,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />

      <List sx={{ px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const itemPath = (item as any).dynamic ? getEmployeeProfilePath() : item.path;
          const active = isActive(itemPath);

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => navigate(itemPath)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: active
                      ? 'primary.dark'
                      : alpha('#667eea', 0.08),
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                      transform: 'translateX(4px)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? 'white' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9375rem',
                    fontWeight: active ? 600 : 500,
                  }}
                />
                {active && (
                  <ChevronRightIcon sx={{ fontSize: 20, ml: 1 }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Attendance section - only for manager/admin */}
        {role !== 'employee' && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={handleAttendanceClick}
                selected={location.pathname.startsWith('/manager/attendance') || location.pathname.startsWith('/attendance/employee')}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.08),
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText primary="Attendance" />
                {attendanceOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={attendanceOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    sx={{
                      pl: 4,
                      borderRadius: 2,
                      py: 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: alpha('#667eea', 0.08),
                        transform: 'translateX(4px)',
                      },
                    }}
                    selected={isActive('/manager/attendance')}
                    onClick={() => navigate('/manager/attendance')}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ScheduleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Attendance Management"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    sx={{
                      pl: 4,
                      borderRadius: 2,
                      py: 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: alpha('#667eea', 0.08),
                        transform: 'translateX(4px)',
                      },
                    }}
                    selected={isActive('/attendance/employee')}
                    onClick={() => navigate('/attendance/employee')}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Employee Attendance"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </Collapse>
          </>
        )}

        {/* Masters section - only for admin */}
        {role === 'admin' && (
          <>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={handleMastersClick}
                selected={location.pathname.startsWith('/masters')}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.08),
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Masters" />
                {mastersOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={mastersOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {masterItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      sx={{
                        pl: 4,
                        borderRadius: 2,
                        py: 1,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: alpha('#667eea', 0.08),
                          transform: 'translateX(4px)',
                        },
                      }}
                      selected={isActive(item.path)}
                      onClick={() => navigate(item.path)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
