// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Fingerprint as BiometricIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  CheckCircle as CheckInIcon,
  Cancel as CheckOutIcon,
  Map as MapIcon,
  Camera as CameraIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';

interface AttendanceRecord {
  id?: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'WORK_FROM_HOME';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  };
  biometricData?: {
    fingerprintId: string;
    faceId?: string;
    confidence: number;
  };
  deviceInfo: {
    deviceId: string;
    ipAddress: string;
    userAgent: string;
  };
  workLocation: 'OFFICE' | 'HOME' | 'CLIENT_SITE' | 'FIELD';
  remarks?: string;
  isManualEntry: boolean;
  approvedBy?: string;
}

interface LocationSettings {
  officeLocations: OfficeLocation[];
  allowedRadius: number; // in meters
  requireBiometric: boolean;
  allowWorkFromHome: boolean;
  allowFieldWork: boolean;
  workingHours: {
    start: string;
    end: string;
    lateThreshold: number; // minutes
  };
}

interface OfficeLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
}

interface BiometricDevice {
  id: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastSync: string;
  employeeCount: number;
}

const BiometricAttendanceForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [locationSettings, setLocationSettings] = useState<LocationSettings>({
    officeLocations: [],
    allowedRadius: 100,
    requireBiometric: true,
    allowWorkFromHome: true,
    allowFieldWork: true,
    workingHours: {
      start: '09:00',
      end: '18:00',
      lateThreshold: 15,
    },
  });
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<'OFFICE' | 'HOME' | 'CLIENT_SITE' | 'FIELD'>('OFFICE');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  useEffect(() => {
    loadAttendanceRecords();
    loadLocationSettings();
    loadBiometricDevices();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
        },
        (error) => {
          console.error('Error getting location:', error);
          setSnackbar({ open: true, message: 'Unable to get current location', severity: 'warning' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getAttendanceRecords();
      // Mock data
      const mockRecords: AttendanceRecord[] = [
        {
          id: 1,
          employeeId: 1,
          employeeName: 'John Doe',
          date: '2024-08-28',
          checkInTime: '09:15',
          checkOutTime: '18:30',
          totalHours: 9.25,
          status: 'LATE',
          location: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: 'Mumbai Office, Andheri East',
            accuracy: 5,
          },
          biometricData: {
            fingerprintId: 'FP001',
            confidence: 95,
          },
          deviceInfo: {
            deviceId: 'BIO001',
            ipAddress: '192.168.1.100',
            userAgent: 'Biometric Scanner v2.1',
          },
          workLocation: 'OFFICE',
          isManualEntry: false,
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Jane Smith',
          date: '2024-08-28',
          checkInTime: '08:45',
          checkOutTime: '17:15',
          totalHours: 8.5,
          status: 'PRESENT',
          location: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: 'Home - Work From Home',
            accuracy: 10,
          },
          deviceInfo: {
            deviceId: 'WEB001',
            ipAddress: '192.168.1.50',
            userAgent: 'Chrome Browser',
          },
          workLocation: 'HOME',
          isManualEntry: false,
        },
        {
          id: 3,
          employeeId: 3,
          employeeName: 'Mike Johnson',
          date: '2024-08-28',
          checkInTime: '10:30',
          status: 'PRESENT',
          location: {
            latitude: 19.1136,
            longitude: 72.8697,
            address: 'Client Site - TCS Bandra',
            accuracy: 8,
          },
          deviceInfo: {
            deviceId: 'MOB001',
            ipAddress: '192.168.2.25',
            userAgent: 'Mobile App v1.5',
          },
          workLocation: 'CLIENT_SITE',
          remarks: 'Client meeting and project work',
          isManualEntry: false,
        },
      ];
      setAttendanceRecords(mockRecords);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocationSettings = async () => {
    try {
      // In real app: const response = await apiService.getLocationSettings();
      const mockSettings: LocationSettings = {
        officeLocations: [
          {
            id: 1,
            name: 'Mumbai Head Office',
            address: 'Andheri East, Mumbai',
            latitude: 19.0760,
            longitude: 72.8777,
            radius: 100,
            isActive: true,
          },
          {
            id: 2,
            name: 'Pune Branch',
            address: 'Hinjewadi, Pune',
            latitude: 18.5912,
            longitude: 73.7389,
            radius: 150,
            isActive: true,
          },
        ],
        allowedRadius: 100,
        requireBiometric: true,
        allowWorkFromHome: true,
        allowFieldWork: true,
        workingHours: {
          start: '09:00',
          end: '18:00',
          lateThreshold: 15,
        },
      };
      setLocationSettings(mockSettings);
    } catch (error) {
      console.error('Error loading location settings:', error);
    }
  };

  const loadBiometricDevices = async () => {
    try {
      // In real app: const response = await apiService.getBiometricDevices();
      const mockDevices: BiometricDevice[] = [
        {
          id: 'BIO001',
          name: 'Main Entrance Scanner',
          location: 'Ground Floor - Main Gate',
          status: 'ONLINE',
          lastSync: '2024-08-28T08:30:00Z',
          employeeCount: 150,
        },
        {
          id: 'BIO002',
          name: 'IT Floor Scanner',
          location: '3rd Floor - IT Department',
          status: 'ONLINE',
          lastSync: '2024-08-28T08:25:00Z',
          employeeCount: 75,
        },
        {
          id: 'BIO003',
          name: 'HR Floor Scanner',
          location: '2nd Floor - HR Department',
          status: 'MAINTENANCE',
          lastSync: '2024-08-27T18:00:00Z',
          employeeCount: 25,
        },
      ];
      setBiometricDevices(mockDevices);
    } catch (error) {
      console.error('Error loading biometric devices:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const isWithinOfficeRadius = () => {
    if (!currentLocation) return false;

    return locationSettings.officeLocations.some(office => {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        office.latitude,
        office.longitude
      );
      return distance <= office.radius;
    });
  };

  const handleCheckIn = async () => {
    if (!currentLocation) {
      setSnackbar({ open: true, message: 'Location access required for check-in', severity: 'error' });
      return;
    }

    if (selectedWorkLocation === 'OFFICE' && !isWithinOfficeRadius()) {
      setSnackbar({ open: true, message: 'You are not within office premises', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      const newRecord: AttendanceRecord = {
        id: Date.now(),
        employeeId: 1, // Current user
        employeeName: 'Current User',
        date: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toTimeString().slice(0, 5),
        status: 'PRESENT',
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: selectedWorkLocation === 'OFFICE' ? 'Office Location' : 
                   selectedWorkLocation === 'HOME' ? 'Work From Home' : 
                   selectedWorkLocation === 'CLIENT_SITE' ? 'Client Site' : 'Field Work',
          accuracy: currentLocation.coords.accuracy || 0,
        },
        deviceInfo: {
          deviceId: 'WEB001',
          ipAddress: '192.168.1.100',
          userAgent: navigator.userAgent,
        },
        workLocation: selectedWorkLocation,
        isManualEntry: false,
      };

      // In real app: await apiService.recordCheckIn(newRecord);
      setAttendanceRecords(prev => [newRecord, ...prev]);
      setCheckInDialog(false);
      setSnackbar({ open: true, message: 'Check-in recorded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error recording check-in:', error);
      setSnackbar({ open: true, message: 'Error recording check-in', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.recordCheckOut();
      setSnackbar({ open: true, message: 'Check-out recorded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error recording check-out:', error);
      setSnackbar({ open: true, message: 'Error recording check-out', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'LATE': return 'warning';
      case 'ABSENT': return 'error';
      case 'HALF_DAY': return 'info';
      case 'WORK_FROM_HOME': return 'primary';
      default: return 'default';
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'success';
      case 'OFFLINE': return 'error';
      case 'MAINTENANCE': return 'warning';
      default: return 'default';
    }
  };

  const getWorkLocationIcon = (location: string) => {
    switch (location) {
      case 'OFFICE': return <LocationIcon />;
      case 'HOME': return <WifiIcon />;
      case 'CLIENT_SITE': return <MapIcon />;
      case 'FIELD': return <CameraIcon />;
      default: return <LocationIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Attendance & Location Tracking
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Advanced attendance management with biometric authentication and GPS location tracking.
      </Typography>
      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom>Current Time</Typography>
              <Typography variant="h4" color="primary">
                {new Date().toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleDateString()}
              </Typography>
            </Card>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom>Location Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <LocationIcon color={currentLocation ? 'success' : 'error'} />
                <Typography variant="body1">
                  {currentLocation ? 'Location Detected' : 'Location Required'}
                </Typography>
              </Box>
              {currentLocation && isWithinOfficeRadius() && (
                <Chip label="Within Office Premises" color="success" size="small" sx={{ mt: 1 }} />
              )}
            </Card>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckInIcon />}
                onClick={() => setCheckInDialog(true)}
                fullWidth
                size="large"
              >
                Check In
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CheckOutIcon />}
                onClick={handleCheckOut}
                fullWidth
                size="large"
              >
                Check Out
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      {/* Tab Navigation */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0 }}>
            {[
              { id: 'attendance', label: 'Attendance Records', icon: <TimeIcon /> },
              { id: 'devices', label: 'Devices', icon: <BiometricIcon /> },
              { id: 'locations', label: 'Office Locations', icon: <LocationIcon /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'contained' : 'text'}
                startIcon={tab.icon}
                sx={{ borderRadius: 0, minWidth: 180 }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Attendance Records Tab */}
          {activeTab === 'attendance' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Today's Attendance Records
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Check In</TableCell>
                      <TableCell>Check Out</TableCell>
                      <TableCell>Total Hours</TableCell>
                      <TableCell>Work Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Verification</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar>{record.employeeName.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {record.employeeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {record.employeeId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{record.checkInTime || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{record.checkOutTime || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {record.totalHours ? `${record.totalHours}h` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getWorkLocationIcon(record.workLocation)}
                            <Typography variant="body2">
                              {record.workLocation.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.status.replace('_', ' ')}
                            color={getStatusColor(record.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {record.location.address}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Accuracy: {record.location.accuracy}m
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {record.biometricData ? (
                              <Chip
                                label={`Biometric (${record.biometricData.confidence}%)`}
                                color="success"
                                size="small"
                                icon={<BiometricIcon />}
                              />
                            ) : (
                              <Chip
                                label="Location Only"
                                color="info"
                                size="small"
                                icon={<LocationIcon />}
                              />
                            )}
                            {record.isManualEntry && (
                              <Chip
                                label="Manual"
                                color="warning"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Biometric Devices Tab */}
          {activeTab === 'devices' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Device Status
              </Typography>

              <Grid container spacing={3}>
                {biometricDevices.map((device) => (
                  <Grid
                    key={device.id}
                    size={{
                      xs: 12,
                      md: 6,
                      lg: 4
                    }}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light' }}>
                              <BiometricIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{device.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {device.id}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={device.status}
                            color={getDeviceStatusColor(device.status) as any}
                            size="small"
                          />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Typography variant="body2"><strong>Location:</strong> {device.location}</Typography>
                        <Typography variant="body2"><strong>Enrolled Users:</strong> {device.employeeCount}</Typography>
                        <Typography variant="body2"><strong>Last Sync:</strong> {new Date(device.lastSync).toLocaleString()}</Typography>

                        <Box sx={{ mt: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={device.status === 'ONLINE' ? 100 : device.status === 'MAINTENANCE' ? 50 : 0}
                            color={device.status === 'ONLINE' ? 'success' : device.status === 'MAINTENANCE' ? 'warning' : 'error'}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Office Locations Tab */}
          {activeTab === 'locations' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Office Locations & Geofencing
              </Typography>

              <Grid container spacing={3}>
                {locationSettings.officeLocations.map((location) => (
                  <Grid
                    key={location.id}
                    size={{
                      xs: 12,
                      md: 6
                    }}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.light' }}>
                              <LocationIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{location.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {location.address}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={location.isActive ? 'Active' : 'Inactive'}
                            color={location.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Typography variant="body2"><strong>Coordinates:</strong> {location.latitude}, {location.longitude}</Typography>
                        <Typography variant="body2"><strong>Geofence Radius:</strong> {location.radius}m</Typography>
                        
                        {currentLocation && (
                          <Typography variant="body2" color="primary">
                            <strong>Distance from you:</strong> {
                              Math.round(calculateDistance(
                                currentLocation.coords.latitude,
                                currentLocation.coords.longitude,
                                location.latitude,
                                location.longitude
                              ))
                            }m
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Location Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        md: 3
                      }}>
                      <Typography variant="body2"><strong>Allowed Radius:</strong> {locationSettings.allowedRadius}m</Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        md: 3
                      }}>
                      <Typography variant="body2"><strong>Working Hours:</strong> {locationSettings.workingHours.start} - {locationSettings.workingHours.end}</Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        md: 3
                      }}>
                      <Typography variant="body2"><strong>Late Threshold:</strong> {locationSettings.workingHours.lateThreshold} minutes</Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        md: 3
                      }}>
                      <Typography variant="body2"><strong>Biometric Required:</strong> {locationSettings.requireBiometric ? 'Yes' : 'No'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Paper>
      {/* Check-in Dialog */}
      <Dialog open={checkInDialog} onClose={() => setCheckInDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Check In</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel id="work-location-label" shrink={!!selectedWorkLocation || true}>Work Location</InputLabel>
                <Select
                  labelId="work-location-label"
                  value={selectedWorkLocation}
                  label="Work Location"
                  onChange={(e) => setSelectedWorkLocation(e.target.value as any)}
                  displayEmpty
                  renderValue={(selected: any) => {
                    if (!selected || selected === '') {
                      return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>Select Work Location</span>;
                    }
                    const locationLabels: { [key: string]: string } = {
                      'OFFICE': 'Office',
                      'HOME': 'Work From Home',
                      'CLIENT_SITE': 'Client Site',
                      'FIELD': 'Field Work',
                    };
                    return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{locationLabels[selected] || selected}</span>;
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      paddingLeft: '20px !important',
                      paddingRight: '40px !important',
                      paddingTop: '14px !important',
                      paddingBottom: '14px !important',
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      width: '100% !important',
                      boxSizing: 'border-box',
                      '@media (max-width:600px)': {
                        paddingLeft: '16px !important',
                        paddingRight: '32px !important',
                        paddingTop: '10px !important',
                        paddingBottom: '10px !important',
                      },
                    },
                    '& .MuiSelect-select > span': {
                      overflow: 'visible !important',
                      textOverflow: 'clip !important',
                      whiteSpace: 'nowrap !important',
                      maxWidth: 'none !important',
                      width: 'auto !important',
                    },
                  }}
                >
                  <MenuItem value="OFFICE">Office</MenuItem>
                  <MenuItem value="HOME">Work From Home</MenuItem>
                  <MenuItem value="CLIENT_SITE">Client Site</MenuItem>
                  <MenuItem value="FIELD">Field Work</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {currentLocation && (
              <Grid size={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Current Location:</strong><br />
                    Latitude: {currentLocation.coords.latitude.toFixed(6)}<br />
                    Longitude: {currentLocation.coords.longitude.toFixed(6)}<br />
                    Accuracy: {currentLocation.coords.accuracy}m
                  </Typography>
                </Alert>
              </Grid>
            )}

            {selectedWorkLocation === 'OFFICE' && !isWithinOfficeRadius() && (
              <Grid size={12}>
                <Alert severity="warning">
                  You are not within the office premises. Please ensure you are at the correct location.
                </Alert>
              </Grid>
            )}

            {selectedWorkLocation === 'OFFICE' && isWithinOfficeRadius() && (
              <Grid size={12}>
                <Alert severity="success">
                  Location verified. You are within office premises.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCheckIn}
            disabled={loading || !currentLocation}
          >
            {loading ? 'Recording...' : 'Check In'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default BiometricAttendanceForm;
