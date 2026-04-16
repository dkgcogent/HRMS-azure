// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Breadcrumbs,
  Link,
  Badge,
  ListItemIcon,
  ListItemText,
  alpha,
  InputBase,
  Paper,
  Button,
  Tooltip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Logout,
  NavigateNext as NavigateNextIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  List as ListIcon,
  DoneAll as DoneAllIcon,
  Cake as CakeIcon,
  NotificationImportant as NotificationImportantIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface BellNotification {
  id: number;
  templateName: string;
  subject: string;
  content: string;
  sentDate: string;
  sentTime: string;
  channel: string;
  status: string;
  isRead: boolean;
}

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<BellNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await apiService.getBellNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching bell notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getRoleDisplayName = () => {
    const role = user?.role || 'employee';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAsRead = async (id: number) => {
    await apiService.markBellNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await apiService.markAllBellNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
    handleClose();
  };

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = [
      <Link
        key="home"
        color="inherit"
        href="/dashboard"
        onClick={(e) => {
          e.preventDefault();
          navigate('/dashboard');
        }}
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        Home
      </Link>
    ];

    pathnames.forEach((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;

      let displayName = value.charAt(0).toUpperCase() + value.slice(1);

      if (value === 'manpower-types') displayName = 'Manpower Types';
      if (value === 'work-locations') displayName = 'Work Locations';
      if (value === 'payment-modes') displayName = 'Payment Modes';
      if (value === 'document-types') displayName = 'Document Types';
      if (value === 'new') displayName = 'New';
      if (value === 'edit') displayName = 'Edit';

      if (isLast) {
        breadcrumbs.push(
          <Typography key={to} color="text.primary" sx={{ fontWeight: 600 }}>
            {displayName}
          </Typography>
        );
      } else {
        breadcrumbs.push(
          <Link
            key={to}
            color="inherit"
            href={to}
            onClick={(e) => {
              e.preventDefault();
              navigate(to);
            }}
            sx={{
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {displayName}
          </Link>
        );
      }
    });

    return breadcrumbs;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/employees') return 'Employee Management';
    if (path === '/employees/new') return 'Add New Employee';
    if (path.startsWith('/employees/edit/')) return 'Edit Employee';
    if (path === '/performance/kpi-list') return 'KPI List';
    if (path === '/performance/kpi/create') return 'Create KPI';
    if (path.startsWith('/performance/kpi/edit/')) return 'Edit KPI';
    if (path === '/performance/manager-review') return 'KPI Review';
    if (path === '/masters/manpower-types') return 'Manpower Types';
    if (path === '/masters/departments') return 'Departments';
    if (path === '/masters/designations') return 'Designations';
    if (path === '/masters/shifts') return 'Shifts';
    if (path === '/masters/work-locations') return 'Work Locations';
    if (path === '/masters/banks') return 'Banks';
    if (path === '/masters/payment-modes') return 'Payment Modes';
    if (path === '/masters/qualifications') return 'Qualifications';
    if (path === '/masters/document-types') return 'Document Types';
    return 'HRMS';
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              color: 'text.primary',
              mb: 0.5,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {getPageTitle()}
          </Typography>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
            aria-label="breadcrumb"
            sx={{ fontSize: '0.875rem' }}
          >
            {getBreadcrumbs()}
          </Breadcrumbs>
        </Box>

        {/* Search Bar */}
        <Paper
          component="form"
          sx={{
            p: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            width: 300,
            mr: 2,
            backgroundColor: alpha('#667eea', 0.05),
            border: '1px solid',
            borderColor: alpha('#667eea', 0.1),
            borderRadius: 2,
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: alpha('#667eea', 0.3),
              backgroundColor: alpha('#667eea', 0.08),
            },
            '&:focus-within': {
              borderColor: '#667eea',
              backgroundColor: 'white',
              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
            },
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
            placeholder="Search..."
            inputProps={{ 'aria-label': 'search' }}
          />
          <IconButton type="button" sx={{ p: '8px' }} aria-label="search">
            <SearchIcon fontSize="small" />
          </IconButton>
        </Paper>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* KPI List Button for Admin */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button
              variant="outlined"
              startIcon={<ListIcon />}
              onClick={() => navigate('/performance/kpi-list')}
              sx={{
                mr: 1,
                textTransform: 'none',
                borderColor: alpha('#667eea', 0.3),
                color: '#667eea',
                '&:hover': {
                  borderColor: '#667eea',
                  backgroundColor: alpha('#667eea', 0.08),
                },
              }}
            >
              KPI List
            </Button>
          )}

          {/* Notifications */}
          <IconButton
            onClick={handleNotificationClick}
            sx={{
              position: 'relative',
              '&:hover': {
                backgroundColor: alpha('#667eea', 0.08),
              },
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon sx={{ color: 'text.secondary' }} />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            PaperProps={{
              sx: {
                width: 380,
                maxHeight: 500,
                mt: 1.5,
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
                overflow: 'hidden',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* Header */}
            <Box sx={{
              p: 2,
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #667eea08, #764ba208)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon sx={{ color: '#667eea', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Box sx={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '10px',
                    px: 0.8,
                    py: 0.1,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    minWidth: 20,
                    textAlign: 'center',
                  }}>
                    {unreadCount}
                  </Box>
                )}
              </Box>
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={handleMarkAllRead} sx={{ color: '#667eea' }}>
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Notification List */}
            <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
              {loadingNotifications ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No notifications yet
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Reminders sent from admin will appear here
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification, index) => (
                  <Box key={notification.id}>
                    <MenuItem
                      onClick={() => {
                        handleMarkAsRead(notification.id);
                        handleNotificationClose();
                      }}
                      sx={{
                        py: 1.5,
                        px: 2,
                        alignItems: 'flex-start',
                        backgroundColor: notification.isRead ? 'transparent' : alpha('#667eea', 0.04),
                        borderLeft: notification.isRead ? '3px solid transparent' : '3px solid #667eea',
                        '&:hover': {
                          backgroundColor: alpha('#667eea', 0.08),
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                        <Avatar sx={{
                          width: 36, height: 36, flexShrink: 0,
                          background: notification.templateName?.includes('Birthday')
                            ? 'linear-gradient(135deg, #f093fb, #f5576c)'
                            : 'linear-gradient(135deg, #667eea, #764ba2)',
                          fontSize: '1rem'
                        }}>
                          {notification.templateName?.includes('Birthday') ? '🎂' : '🔔'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.isRead ? 400 : 700,
                              color: 'text.primary',
                              fontSize: '0.8rem',
                              lineHeight: 1.3,
                              mb: 0.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {notification.subject}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              fontSize: '0.72rem',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {notification.content}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#667eea', fontSize: '0.68rem', mt: 0.3, display: 'block' }}>
                            {notification.sentDate} {notification.sentTime}
                          </Typography>
                        </Box>
                        {!notification.isRead && (
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: '#667eea',
                            mt: 0.5, flexShrink: 0,
                          }} />
                        )}
                      </Box>
                    </MenuItem>
                    {index < notifications.length - 1 && <Divider sx={{ my: 0 }} />}
                  </Box>
                ))
              )}
            </Box>
          </Menu>


          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 1 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRoleDisplayName()}
              </Typography>
            </Box>
            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{
                p: 0,
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s',
                },
              }}
            >
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
            </IconButton>
          </Box>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                width: 220,
                mt: 1.5,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || user?.username || ''}
              </Typography>
            </Box>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
