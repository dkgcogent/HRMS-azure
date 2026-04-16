import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CalendarToday,
  Public,
  Business,
  LocationOn,
  Download,
  Upload,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY';
  locationId?: number;
  locationName?: string;
  isOptional: boolean;
  description?: string;
  createdAt: string;
}

interface HolidayFormData {
  name: string;
  date: Date | null;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY';
  locationId: number;
  isOptional: boolean;
  description: string;
}

interface WorkLocation {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
}

const HolidayCalendarForm: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    holiday: Holiday | null;
  }>({ open: false, mode: 'create', holiday: null });

  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: null,
    type: 'COMPANY',
    locationId: 0,
    isOptional: false,
    description: '',
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Sample data
  const sampleHolidays: Holiday[] = [
    {
      id: 1,
      name: 'New Year\'s Day',
      date: '2024-01-01',
      type: 'NATIONAL',
      isOptional: false,
      description: 'New Year celebration',
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Republic Day',
      date: '2024-01-26',
      type: 'NATIONAL',
      isOptional: false,
      description: 'Republic Day of India',
      createdAt: '2024-01-01',
    },
    {
      id: 3,
      name: 'Holi',
      date: '2024-03-25',
      type: 'NATIONAL',
      isOptional: false,
      description: 'Festival of Colors',
      createdAt: '2024-01-01',
    },
    {
      id: 4,
      name: 'Gudi Padwa',
      date: '2024-04-09',
      type: 'REGIONAL',
      locationId: 1,
      locationName: 'Mumbai Office',
      isOptional: true,
      description: 'Marathi New Year',
      createdAt: '2024-01-01',
    },
    {
      id: 5,
      name: 'Company Foundation Day',
      date: '2024-05-15',
      type: 'COMPANY',
      isOptional: false,
      description: 'Company anniversary celebration',
      createdAt: '2024-01-01',
    },
  ];

  const sampleWorkLocations: WorkLocation[] = [
    { id: 1, name: 'Mumbai Office', code: 'MUM', city: 'Mumbai', state: 'Maharashtra' },
    { id: 2, name: 'Delhi Office', code: 'DEL', city: 'New Delhi', state: 'Delhi' },
    { id: 3, name: 'Bangalore Office', code: 'BLR', city: 'Bangalore', state: 'Karnataka' },
  ];

  useEffect(() => {
    fetchHolidays();
    fetchWorkLocations();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      setHolidays(sampleHolidays.filter(h => 
        new Date(h.date).getFullYear() === selectedYear
      ));
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to fetch holidays',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkLocations = async () => {
    try {
      // TODO: Implement API call
      setWorkLocations(sampleWorkLocations);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to fetch work locations',
      });
    }
  };

  const handleCreateHoliday = () => {
    setFormData({
      name: '',
      date: null,
      type: 'COMPANY',
      locationId: 0,
      isOptional: false,
      description: '',
    });
    setDialog({ open: true, mode: 'create', holiday: null });
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setFormData({
      name: holiday.name,
      date: new Date(holiday.date),
      type: holiday.type,
      locationId: holiday.locationId || 0,
      isOptional: holiday.isOptional,
      description: holiday.description || '',
    });
    setDialog({ open: true, mode: 'edit', holiday });
  };

  const handleDeleteHoliday = async (holidayId: number) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;

    try {
      // TODO: Implement API call
      const response = await fetch(`/api/holidays/${holidayId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setAlert({
          type: 'success',
          message: 'Holiday deleted successfully',
        });
        fetchHolidays();
      } else {
        const error = await response.json();
        setAlert({
          type: 'error',
          message: error.message || 'Failed to delete holiday',
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.date) {
      setAlert({
        type: 'error',
        message: 'Please fill all required fields',
      });
      return;
    }

    if (formData.type === 'REGIONAL' && !formData.locationId) {
      setAlert({
        type: 'error',
        message: 'Please select a location for regional holidays',
      });
      return;
    }

    setLoading(true);
    try {
      const url = dialog.mode === 'create' 
        ? '/api/holidays' 
        : `/api/holidays/${dialog.holiday?.id}`;
      
      const method = dialog.mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          date: formData.date?.toISOString().split('T')[0],
          type: formData.type,
          locationId: formData.type === 'REGIONAL' ? formData.locationId : null,
          isOptional: formData.isOptional,
          description: formData.description,
        }),
      });

      if (response.ok) {
        setAlert({
          type: 'success',
          message: `Holiday ${dialog.mode === 'create' ? 'created' : 'updated'} successfully`,
        });
        fetchHolidays();
        setDialog({ open: false, mode: 'create', holiday: null });
      } else {
        const error = await response.json();
        setAlert({
          type: 'error',
          message: error.message || `Failed to ${dialog.mode} holiday`,
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NATIONAL': return <Public />;
      case 'REGIONAL': return <LocationOn />;
      case 'COMPANY': return <Business />;
      default: return <CalendarToday />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NATIONAL': return 'primary';
      case 'REGIONAL': return 'secondary';
      case 'COMPANY': return 'info';
      default: return 'default';
    }
  };

  const getHolidayStats = () => {
    const total = holidays.length;
    const national = holidays.filter(h => h.type === 'NATIONAL').length;
    const regional = holidays.filter(h => h.type === 'REGIONAL').length;
    const company = holidays.filter(h => h.type === 'COMPANY').length;
    const optional = holidays.filter(h => h.isOptional).length;

    return { total, national, regional, company, optional };
  };

  const stats = getHolidayStats();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Holiday Calendar Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value as number)}
                  size="small"
                >
                  {[2023, 2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {/* TODO: Export holidays */}}
              >
                Export
              </Button>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => {/* TODO: Import holidays */}}
              >
                Import
              </Button>
            </Box>
          </Box>

          {alert && (
            <Alert 
              severity={alert.type} 
              sx={{ mb: 3 }}
              onClose={() => setAlert(null)}
            >
              {alert.message}
            </Alert>
          )}

          {/* Statistics Cards */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    Total Holidays
                  </Typography>
                  <Typography variant="h3">{stats.total}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    National
                  </Typography>
                  <Typography variant="h3">{stats.national}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary.main">
                    Regional
                  </Typography>
                  <Typography variant="h3">{stats.regional}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    Company
                  </Typography>
                  <Typography variant="h3">{stats.company}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    Optional
                  </Typography>
                  <Typography variant="h3">{stats.optional}</Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Holidays Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Holiday Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Day</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Optional</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {holiday.name}
                        </Typography>
                        {holiday.description && (
                          <Typography variant="caption" color="textSecondary">
                            {holiday.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(holiday.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(holiday.type)}
                        label={holiday.type}
                        color={getTypeColor(holiday.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {holiday.locationName || 'All Locations'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={holiday.isOptional ? 'Optional' : 'Mandatory'}
                        color={holiday.isOptional ? 'warning' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditHoliday(holiday)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {holidays.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No holidays found for {selectedYear}
              </Typography>
              <Button
                variant="contained"
                onClick={handleCreateHoliday}
                sx={{ mt: 2 }}
                startIcon={<Add />}
              >
                Add First Holiday
              </Button>
            </Box>
          )}
        </Paper>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add holiday"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateHoliday}
        >
          <Add />
        </Fab>

        {/* Create/Edit Holiday Dialog */}
        <Dialog 
          open={dialog.open} 
          onClose={() => setDialog({ open: false, mode: 'create', holiday: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialog.mode === 'create' ? 'Add New Holiday' : 'Edit Holiday'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Holiday Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 3, mt: 2 }}
              required
            />

            <DatePicker
              label="Holiday Date"
              value={formData.date}
              onChange={(newValue) => setFormData(prev => ({ ...prev, date: newValue }))}
              sx={{ mb: 3, width: '100%' }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Holiday Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <MenuItem value="NATIONAL">National</MenuItem>
                <MenuItem value="REGIONAL">Regional</MenuItem>
                <MenuItem value="COMPANY">Company</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'REGIONAL' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.locationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value as number }))}
                >
                  {workLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} ({location.city})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Holiday Nature</InputLabel>
              <Select
                value={formData.isOptional.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, isOptional: e.target.value === 'true' }))}
              >
                <MenuItem value="false">Mandatory</MenuItem>
                <MenuItem value="true">Optional</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add description for this holiday..."
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDialog({ open: false, mode: 'create', holiday: null })}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !formData.name.trim() || !formData.date}
            >
              {loading ? 'Saving...' : dialog.mode === 'create' ? 'Add Holiday' : 'Update Holiday'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default HolidayCalendarForm;
