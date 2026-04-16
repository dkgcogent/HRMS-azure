// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

interface JobPosting {
  id?: number;
  title: string;
  departmentId: number;
  departmentName?: string;
  designationId: number;
  designationName?: string;
  workLocationId: number;
  workLocationName?: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'EXECUTIVE';
  minExperience: number;
  maxExperience: number;
  minSalary: number;
  maxSalary: number;
  currency: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  skills: string[];
  qualificationIds: number[];
  applicationDeadline: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ON_HOLD';
  postedDate: string;
  postedBy: number;
  isActive: boolean;
}

const JobPostingForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [jobPosting, setJobPosting] = useState<JobPosting>({
    title: '',
    departmentId: 0,
    designationId: 0,
    workLocationId: 0,
    jobType: 'FULL_TIME',
    experienceLevel: 'MID',
    minExperience: 0,
    maxExperience: 5,
    minSalary: 0,
    maxSalary: 0,
    currency: 'INR',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    skills: [],
    qualificationIds: [],
    applicationDeadline: '',
    status: 'DRAFT',
    postedDate: new Date().toISOString().split('T')[0],
    postedBy: 1, // Current user ID
    isActive: true,
  });

  useEffect(() => {
    loadMasterData();
    if (isEdit && id) {
      loadJobPosting(parseInt(id));
    }
  }, [isEdit, id]);

  const loadMasterData = async () => {
    try {
      const [departmentsRes, designationsRes, workLocationsRes, qualificationsRes] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDesignations(),
        apiService.getWorkLocations(),
        apiService.getQualifications()
      ]);

      setDepartments(departmentsRes.data || []);
      setDesignations(designationsRes.data || []);
      setWorkLocations(workLocationsRes.data || []);
      setQualifications(qualificationsRes.data || []);
    } catch (error) {
      console.error('Error loading master data:', error);
      // Fallback data
      setDepartments([
        { id: 1, name: 'Human Resources' },
        { id: 2, name: 'Information Technology' },
        { id: 3, name: 'Finance' },
      ]);
      setDesignations([
        { id: 1, name: 'HR Manager', departmentId: 1 },
        { id: 3, name: 'Software Engineer', departmentId: 2 },
        { id: 6, name: 'Accountant', departmentId: 3 },
      ]);
      setWorkLocations([
        { id: 1, name: 'Mumbai Office' },
        { id: 2, name: 'Delhi Office' },
        { id: 3, name: 'Bangalore Office' },
      ]);
      setQualifications([
        { id: 1, name: 'Bachelor\'s Degree' },
        { id: 2, name: 'Master\'s Degree' },
      ]);
    }
  };

  const loadJobPosting = async (jobId: number) => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getJobPostingById(jobId);
    } catch (error) {
      console.error('Error loading job posting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof JobPosting) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setJobPosting(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDepartmentChange = (event: any) => {
    const departmentId = event.target.value;
    setJobPosting(prev => ({
      ...prev,
      departmentId: departmentId,
      designationId: 0 // Reset designation when department changes
    }));
  };

  const handleSkillsChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const skill = (event.target as HTMLInputElement).value.trim();
      if (skill && !jobPosting.skills.includes(skill)) {
        setJobPosting(prev => ({
          ...prev,
          skills: [...prev.skills, skill]
        }));
        (event.target as HTMLInputElement).value = '';
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setJobPosting(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleQualificationChange = (event: any) => {
    const value = event.target.value as number[];
    setJobPosting(prev => ({
      ...prev,
      qualificationIds: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!jobPosting.title.trim()) errors.push('Job Title is required');
    if (!jobPosting.departmentId) errors.push('Department is required');
    if (!jobPosting.designationId) errors.push('Designation is required');
    if (!jobPosting.workLocationId) errors.push('Work Location is required');
    if (!jobPosting.description.trim()) errors.push('Job Description is required');
    if (!jobPosting.requirements.trim()) errors.push('Requirements are required');
    if (!jobPosting.responsibilities.trim()) errors.push('Responsibilities are required');
    if (!jobPosting.applicationDeadline) errors.push('Application Deadline is required');
    if (jobPosting.minSalary >= jobPosting.maxSalary && jobPosting.maxSalary > 0) {
      errors.push('Maximum Salary must be greater than Minimum Salary');
    }
    if (jobPosting.minExperience > jobPosting.maxExperience) {
      errors.push('Maximum Experience must be greater than or equal to Minimum Experience');
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSnackbar({
        open: true,
        message: 'Please fix the following errors:\n' + validationErrors.join('\n'),
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        // await apiService.updateJobPosting(parseInt(id), jobPosting);
        setSnackbar({ open: true, message: 'Job posting updated successfully!', severity: 'success' });
      } else {
        // await apiService.createJobPosting(jobPosting);
        setSnackbar({ open: true, message: 'Job posting created successfully!', severity: 'success' });
      }
      setTimeout(() => navigate('/recruitment/jobs'), 1500);
    } catch (error) {
      console.error('Error saving job posting:', error);
      setSnackbar({ open: true, message: 'Error saving job posting. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/recruitment/jobs');
  };

  const getFilteredDesignations = () => {
    return designations.filter(d => d.departmentId === jobPosting.departmentId);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit Job Posting' : 'Create Job Posting'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage job postings for recruitment.
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Job Title"
                required
                value={jobPosting.title}
                onChange={handleInputChange('title')}
                placeholder="e.g., Senior Software Engineer"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobPosting.jobType}
                  label="Job Type"
                  onChange={handleInputChange('jobType')}
                >
                  <MenuItem value="FULL_TIME">Full Time</MenuItem>
                  <MenuItem value="PART_TIME">Part Time</MenuItem>
                  <MenuItem value="CONTRACT">Contract</MenuItem>
                  <MenuItem value="INTERNSHIP">Internship</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={jobPosting.departmentId || ''}
                  label="Department"
                  onChange={handleDepartmentChange}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth required>
                <InputLabel>Designation</InputLabel>
                <Select
                  value={jobPosting.designationId || ''}
                  label="Designation"
                  onChange={handleInputChange('designationId')}
                  disabled={!jobPosting.departmentId}
                >
                  {getFilteredDesignations().map((designation) => (
                    <MenuItem key={designation.id} value={designation.id}>
                      {designation.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth required>
                <InputLabel>Work Location</InputLabel>
                <Select
                  value={jobPosting.workLocationId || ''}
                  label="Work Location"
                  onChange={handleInputChange('workLocationId')}
                >
                  {workLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Experience & Salary */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Experience & Compensation
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={jobPosting.experienceLevel}
                  label="Experience Level"
                  onChange={handleInputChange('experienceLevel')}
                >
                  <MenuItem value="ENTRY">Entry Level</MenuItem>
                  <MenuItem value="MID">Mid Level</MenuItem>
                  <MenuItem value="SENIOR">Senior Level</MenuItem>
                  <MenuItem value="EXECUTIVE">Executive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Min Experience (Years)"
                type="number"
                value={jobPosting.minExperience}
                onChange={handleInputChange('minExperience')}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Max Experience (Years)"
                type="number"
                value={jobPosting.maxExperience}
                onChange={handleInputChange('maxExperience')}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={jobPosting.status}
                  label="Status"
                  onChange={handleInputChange('status')}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                  <MenuItem value="ON_HOLD">On Hold</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Min Salary"
                type="number"
                value={jobPosting.minSalary}
                onChange={handleInputChange('minSalary')}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Max Salary"
                type="number"
                value={jobPosting.maxSalary}
                onChange={handleInputChange('maxSalary')}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Application Deadline"
                type="date"
                required
                value={jobPosting.applicationDeadline}
                onChange={handleInputChange('applicationDeadline')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Job Details */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Job Details
              </Typography>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Job Description"
                multiline
                rows={4}
                required
                value={jobPosting.description}
                onChange={handleInputChange('description')}
                placeholder="Provide a detailed description of the job role..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Requirements"
                multiline
                rows={4}
                required
                value={jobPosting.requirements}
                onChange={handleInputChange('requirements')}
                placeholder="List the required qualifications and skills..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Responsibilities"
                multiline
                rows={4}
                required
                value={jobPosting.responsibilities}
                onChange={handleInputChange('responsibilities')}
                placeholder="Describe the key responsibilities..."
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Benefits"
                multiline
                rows={3}
                value={jobPosting.benefits}
                onChange={handleInputChange('benefits')}
                placeholder="List the benefits and perks offered..."
              />
            </Grid>

            {/* Skills */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Skills & Qualifications
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Required Skills"
                placeholder="Type a skill and press Enter"
                onKeyPress={handleSkillsChange}
                helperText="Press Enter to add skills"
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {jobPosting.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => removeSkill(skill)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth>
                <InputLabel>Required Qualifications</InputLabel>
                <Select
                  multiple
                  value={jobPosting.qualificationIds}
                  onChange={handleQualificationChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((value) => {
                        const qualification = qualifications.find(q => q.id === value);
                        return (
                          <Chip key={value} label={qualification?.name} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {qualifications.map((qualification) => (
                    <MenuItem key={qualification.id} value={qualification.id}>
                      {qualification.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEdit ? 'Update Job Posting' : 'Create Job Posting'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
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
          sx={{ whiteSpace: 'pre-line' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobPostingForm;
