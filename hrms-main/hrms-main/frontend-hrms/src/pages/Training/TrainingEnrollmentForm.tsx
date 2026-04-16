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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  PersonAdd as EnrollIcon,
  School as TrainingIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';

interface TrainingProgram {
  id: number;
  title: string;
  category: string;
  type: string;
  duration: number;
  maxParticipants: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  venue: string;
  trainerName: string;
  status: string;
  isMandatory: boolean;
  cost: number;
}

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  isEnrolled: boolean;
  enrollmentDate?: string;
  completionStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

interface EnrollmentData {
  programId: number;
  employeeIds: number[];
  enrollmentDate: string;
  remarks?: string;
}

const TrainingEnrollmentForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number>(0);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [enrollmentDialog, setEnrollmentDialog] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    programId: 0,
    employeeIds: [],
    enrollmentDate: new Date().toISOString().split('T')[0],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  useEffect(() => {
    loadTrainingPrograms();
    loadEmployees();
  }, []);

  const loadTrainingPrograms = async () => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getActiveTrainingPrograms();
      // Mock data
      const mockPrograms: TrainingProgram[] = [
        {
          id: 1,
          title: 'Advanced React Development',
          category: 'Technical Skills',
          type: 'INTERNAL',
          duration: 16,
          maxParticipants: 20,
          enrolledCount: 12,
          startDate: '2024-05-01',
          endDate: '2024-05-03',
          venue: 'Training Room A',
          trainerName: 'John Smith',
          status: 'SCHEDULED',
          isMandatory: false,
          cost: 5000,
        },
        {
          id: 2,
          title: 'Leadership Excellence Program',
          category: 'Leadership',
          type: 'EXTERNAL',
          duration: 24,
          maxParticipants: 15,
          enrolledCount: 8,
          startDate: '2024-05-15',
          endDate: '2024-05-17',
          venue: 'External Venue',
          trainerName: 'Leadership Institute',
          status: 'SCHEDULED',
          isMandatory: true,
          cost: 15000,
        },
        {
          id: 3,
          title: 'Workplace Safety Training',
          category: 'Safety',
          type: 'INTERNAL',
          duration: 8,
          maxParticipants: 50,
          enrolledCount: 35,
          startDate: '2024-04-20',
          endDate: '2024-04-20',
          venue: 'Main Auditorium',
          trainerName: 'Safety Officer',
          status: 'ONGOING',
          isMandatory: true,
          cost: 0,
        },
      ];
      setPrograms(mockPrograms);
    } catch (error) {
      console.error('Error loading training programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      // In real app: const response = await apiService.getEmployees();
      // Mock data
      const mockEmployees: Employee[] = [
        {
          id: 1,
          employeeId: 'EMP001',
          name: 'John Doe',
          department: 'Information Technology',
          designation: 'Software Engineer',
          email: 'john.doe@company.com',
          isEnrolled: false,
        },
        {
          id: 2,
          employeeId: 'EMP002',
          name: 'Jane Smith',
          department: 'Human Resources',
          designation: 'HR Manager',
          email: 'jane.smith@company.com',
          isEnrolled: true,
          enrollmentDate: '2024-04-01',
          completionStatus: 'IN_PROGRESS',
        },
        {
          id: 3,
          employeeId: 'EMP003',
          name: 'Mike Johnson',
          department: 'Finance',
          designation: 'Accountant',
          email: 'mike.johnson@company.com',
          isEnrolled: false,
        },
        {
          id: 4,
          employeeId: 'EMP004',
          name: 'Sarah Wilson',
          department: 'Information Technology',
          designation: 'Senior Developer',
          email: 'sarah.wilson@company.com',
          isEnrolled: false,
        },
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleProgramChange = (programId: number) => {
    setSelectedProgram(programId);
    setSelectedEmployees([]);
    // In real app, load enrollment data for this program
  };

  const handleEmployeeSelection = (employeeId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableEmployees = employees
        .filter(emp => !emp.isEnrolled)
        .map(emp => emp.id);
      setSelectedEmployees(availableEmployees);
    } else {
      setSelectedEmployees([]);
    }
  };

  const openEnrollmentDialog = () => {
    if (selectedProgram === 0) {
      setSnackbar({ open: true, message: 'Please select a training program', severity: 'warning' });
      return;
    }
    if (selectedEmployees.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one employee', severity: 'warning' });
      return;
    }

    const program = programs.find(p => p.id === selectedProgram);
    if (program && (program.enrolledCount + selectedEmployees.length) > program.maxParticipants) {
      setSnackbar({ 
        open: true, 
        message: `Cannot enroll ${selectedEmployees.length} employees. Only ${program.maxParticipants - program.enrolledCount} spots available.`, 
        severity: 'error' 
      });
      return;
    }

    setEnrollmentData({
      programId: selectedProgram,
      employeeIds: selectedEmployees,
      enrollmentDate: new Date().toISOString().split('T')[0],
    });
    setEnrollmentDialog(true);
  };

  const submitEnrollment = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.enrollEmployeesInTraining(enrollmentData);
      
      // Update local state
      setEmployees(prev => 
        prev.map(emp => 
          enrollmentData.employeeIds.includes(emp.id)
            ? { 
                ...emp, 
                isEnrolled: true, 
                enrollmentDate: enrollmentData.enrollmentDate,
                completionStatus: 'NOT_STARTED' as const
              }
            : emp
        )
      );

      setPrograms(prev =>
        prev.map(prog =>
          prog.id === enrollmentData.programId
            ? { ...prog, enrolledCount: prog.enrolledCount + enrollmentData.employeeIds.length }
            : prog
        )
      );

      setSnackbar({
        open: true,
        message: `Successfully enrolled ${enrollmentData.employeeIds.length} employees in training!`,
        severity: 'success'
      });

      setEnrollmentDialog(false);
      setSelectedEmployees([]);
    } catch (error) {
      console.error('Error enrolling employees:', error);
      setSnackbar({ open: true, message: 'Error enrolling employees. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'FAILED': return 'error';
      case 'NOT_STARTED': return 'default';
      default: return 'default';
    }
  };

  const getCompletionPercentage = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 100;
      case 'IN_PROGRESS': return 50;
      case 'FAILED': return 25;
      case 'NOT_STARTED': return 0;
      default: return 0;
    }
  };

  const selectedProgramData = programs.find(p => p.id === selectedProgram);
  const availableSpots = selectedProgramData ? selectedProgramData.maxParticipants - selectedProgramData.enrolledCount : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Training Enrollment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enroll employees in training programs and track their progress.
      </Typography>
      {/* Program Selection */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrainingIcon />
          Select Training Program
        </Typography>

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <FormControl fullWidth>
              <InputLabel>Training Program</InputLabel>
              <Select
                value={selectedProgram}
                label="Training Program"
                onChange={(e) => handleProgramChange(e.target.value as number)}
              >
                <MenuItem value={0}>Select a program...</MenuItem>
                {programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.title} - {program.category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedProgramData && (
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <Card variant="outlined">
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duration:</strong> {selectedProgramData.duration} hours
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Dates:</strong> {new Date(selectedProgramData.startDate).toLocaleDateString()} - {new Date(selectedProgramData.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Capacity:</strong> {selectedProgramData.enrolledCount}/{selectedProgramData.maxParticipants} enrolled
                  </Typography>
                  <Typography variant="body2">
                    <strong>Available Spots:</strong> {availableSpots}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(selectedProgramData.enrolledCount / selectedProgramData.maxParticipants) * 100}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>
      {/* Employee Selection */}
      {selectedProgram > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon />
              Select Employees ({selectedEmployees.length} selected)
            </Typography>
            <Button
              variant="contained"
              startIcon={<EnrollIcon />}
              onClick={openEnrollmentDialog}
              disabled={selectedEmployees.length === 0}
            >
              Enroll Selected
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employees.filter(e => !e.isEnrolled).length}
                      checked={employees.filter(e => !e.isEnrolled).length > 0 && selectedEmployees.length === employees.filter(e => !e.isEnrolled).length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Enrollment Status</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)}
                        disabled={employee.isEnrolled}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {employee.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {employee.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.employeeId} • {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{employee.department}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.designation}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {employee.isEnrolled ? (
                        <Box>
                          <Chip label="Enrolled" color="success" size="small" />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {employee.enrollmentDate && new Date(employee.enrollmentDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip label="Not Enrolled" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {employee.isEnrolled && employee.completionStatus ? (
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption">
                              {employee.completionStatus.replace('_', ' ')}
                            </Typography>
                            <Typography variant="caption">
                              {getCompletionPercentage(employee.completionStatus)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={getCompletionPercentage(employee.completionStatus)}
                            color={getStatusColor(employee.completionStatus) as any}
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not enrolled
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {/* Enrollment Confirmation Dialog */}
      <Dialog open={enrollmentDialog} onClose={() => setEnrollmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Training Enrollment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to enroll <strong>{enrollmentData.employeeIds.length} employees</strong> in:
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {selectedProgramData?.title}
          </Typography>
          
          <TextField
            fullWidth
            label="Enrollment Date"
            type="date"
            value={enrollmentData.enrollmentDate}
            onChange={(e) => setEnrollmentData(prev => ({ ...prev, enrollmentDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2, mb: 2 }}
          />

          <TextField
            fullWidth
            label="Remarks (Optional)"
            multiline
            rows={3}
            value={enrollmentData.remarks || ''}
            onChange={(e) => setEnrollmentData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="Add any remarks about this enrollment..."
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            Enrolled employees will receive email notifications about the training schedule and requirements.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollmentDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submitEnrollment}
            disabled={loading}
          >
            {loading ? 'Enrolling...' : 'Confirm Enrollment'}
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

export default TrainingEnrollmentForm;
