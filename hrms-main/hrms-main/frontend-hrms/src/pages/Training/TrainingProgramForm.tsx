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
  Card,
  CardContent,
  Chip,
  Alert,
  Snackbar,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  School as TrainingIcon,
  Person as TrainerIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface TrainingProgram {
  id?: number;
  title: string;
  description: string;
  category: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'ONLINE' | 'WORKSHOP';
  duration: number; // in hours
  maxParticipants: number;
  trainerId?: number;
  trainerName?: string;
  externalTrainer?: string;
  startDate: string;
  endDate: string;
  venue: string;
  prerequisites?: string;
  objectives: string;
  materials?: string;
  cost: number;
  currency: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  isMandatory: boolean;
  certificateProvided: boolean;
  skillsToGain: string[];
  targetAudience: string;
  isActive: boolean;
}

const trainingCategories = [
  'Technical Skills',
  'Soft Skills',
  'Leadership',
  'Compliance',
  'Safety',
  'Product Knowledge',
  'Process Training',
  'Orientation',
  'Professional Development',
  'Other'
];

const TrainingProgramForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [trainingProgram, setTrainingProgram] = useState<TrainingProgram>({
    title: '',
    description: '',
    category: '',
    type: 'INTERNAL',
    duration: 0,
    maxParticipants: 20,
    startDate: '',
    endDate: '',
    venue: '',
    objectives: '',
    cost: 0,
    currency: 'INR',
    status: 'DRAFT',
    isMandatory: false,
    certificateProvided: false,
    skillsToGain: [],
    targetAudience: '',
    isActive: true,
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadTrainers();
    if (isEdit && id) {
      loadTrainingProgram(parseInt(id));
    }
  }, [isEdit, id]);

  const loadTrainers = async () => {
    try {
      // In real app: const response = await apiService.getTrainers();
      // Mock data
      setTrainers([
        { id: 1, name: 'John Smith', expertise: 'Technical Training' },
        { id: 2, name: 'Sarah Johnson', expertise: 'Soft Skills' },
        { id: 3, name: 'Mike Wilson', expertise: 'Leadership' },
      ]);
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  };

  const loadTrainingProgram = async (programId: number) => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getTrainingProgramById(programId);
      // Mock data for demonstration
    } catch (error) {
      console.error('Error loading training program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TrainingProgram) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setTrainingProgram(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !trainingProgram.skillsToGain.includes(newSkill.trim())) {
      setTrainingProgram(prev => ({
        ...prev,
        skillsToGain: [...prev.skillsToGain, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setTrainingProgram(prev => ({
      ...prev,
      skillsToGain: prev.skillsToGain.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSkillKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkill();
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!trainingProgram.title.trim()) errors.push('Training Title is required');
    if (!trainingProgram.description.trim()) errors.push('Description is required');
    if (!trainingProgram.category) errors.push('Category is required');
    if (!trainingProgram.startDate) errors.push('Start Date is required');
    if (!trainingProgram.endDate) errors.push('End Date is required');
    if (!trainingProgram.venue.trim()) errors.push('Venue is required');
    if (!trainingProgram.objectives.trim()) errors.push('Objectives are required');
    if (!trainingProgram.targetAudience.trim()) errors.push('Target Audience is required');
    if (trainingProgram.duration <= 0) errors.push('Duration must be greater than 0');
    if (trainingProgram.maxParticipants <= 0) errors.push('Max Participants must be greater than 0');

    if (trainingProgram.startDate && trainingProgram.endDate) {
      if (new Date(trainingProgram.startDate) > new Date(trainingProgram.endDate)) {
        errors.push('End Date must be after Start Date');
      }
    }

    if (trainingProgram.type === 'INTERNAL' && !trainingProgram.trainerId) {
      errors.push('Internal Trainer is required for internal training');
    }

    if (trainingProgram.type === 'EXTERNAL' && !trainingProgram.externalTrainer?.trim()) {
      errors.push('External Trainer name is required for external training');
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
        // await apiService.updateTrainingProgram(parseInt(id), trainingProgram);
        setSnackbar({ open: true, message: 'Training program updated successfully!', severity: 'success' });
      } else {
        // await apiService.createTrainingProgram(trainingProgram);
        setSnackbar({ open: true, message: 'Training program created successfully!', severity: 'success' });
      }
      setTimeout(() => navigate('/training/programs'), 1500);
    } catch (error) {
      console.error('Error saving training program:', error);
      setSnackbar({ open: true, message: 'Error saving training program. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/training/programs');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit Training Program' : 'Create Training Program'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage training programs for employee development.
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrainingIcon />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 8
              }}>
              <TextField
                fullWidth
                label="Training Title"
                required
                value={trainingProgram.title}
                onChange={handleInputChange('title')}
                placeholder="e.g., Advanced React Development Workshop"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={trainingProgram.category}
                  label="Category"
                  onChange={handleInputChange('category')}
                >
                  {trainingCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                required
                value={trainingProgram.description}
                onChange={handleInputChange('description')}
                placeholder="Provide a detailed description of the training program..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <FormControl fullWidth required>
                <InputLabel>Training Type</InputLabel>
                <Select
                  value={trainingProgram.type}
                  label="Training Type"
                  onChange={handleInputChange('type')}
                >
                  <MenuItem value="INTERNAL">Internal</MenuItem>
                  <MenuItem value="EXTERNAL">External</MenuItem>
                  <MenuItem value="ONLINE">Online</MenuItem>
                  <MenuItem value="WORKSHOP">Workshop</MenuItem>
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
                label="Duration (Hours)"
                type="number"
                required
                value={trainingProgram.duration}
                onChange={handleInputChange('duration')}
                InputProps={{ inputProps: { min: 0.5, step: 0.5 } }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <TextField
                fullWidth
                label="Max Participants"
                type="number"
                required
                value={trainingProgram.maxParticipants}
                onChange={handleInputChange('maxParticipants')}
                InputProps={{ inputProps: { min: 1 } }}
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
                  value={trainingProgram.status}
                  label="Status"
                  onChange={handleInputChange('status')}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="ONGOING">Ongoing</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Trainer Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <TrainerIcon />
                Trainer Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {trainingProgram.type === 'INTERNAL' && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth required>
                  <InputLabel>Internal Trainer</InputLabel>
                  <Select
                    value={trainingProgram.trainerId || ''}
                    label="Internal Trainer"
                    onChange={handleInputChange('trainerId')}
                  >
                    {trainers.map((trainer) => (
                      <MenuItem key={trainer.id} value={trainer.id}>
                        {trainer.name} - {trainer.expertise}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {trainingProgram.type === 'EXTERNAL' && (
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="External Trainer/Organization"
                  required
                  value={trainingProgram.externalTrainer || ''}
                  onChange={handleInputChange('externalTrainer')}
                  placeholder="Enter trainer name or organization"
                />
              </Grid>
            )}

            {/* Schedule Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <ScheduleIcon />
                Schedule & Venue
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                required
                value={trainingProgram.startDate}
                onChange={handleInputChange('startDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                required
                value={trainingProgram.endDate}
                onChange={handleInputChange('endDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Venue"
                required
                value={trainingProgram.venue}
                onChange={handleInputChange('venue')}
                placeholder="e.g., Conference Room A, Online Platform"
              />
            </Grid>

            {/* Training Details */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Training Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Learning Objectives"
                multiline
                rows={4}
                required
                value={trainingProgram.objectives}
                onChange={handleInputChange('objectives')}
                placeholder="List the key learning objectives..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Target Audience"
                multiline
                rows={4}
                required
                value={trainingProgram.targetAudience}
                onChange={handleInputChange('targetAudience')}
                placeholder="Describe the target audience for this training..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Prerequisites"
                multiline
                rows={3}
                value={trainingProgram.prerequisites || ''}
                onChange={handleInputChange('prerequisites')}
                placeholder="List any prerequisites or requirements..."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Training Materials"
                multiline
                rows={3}
                value={trainingProgram.materials || ''}
                onChange={handleInputChange('materials')}
                placeholder="List materials, resources, or tools needed..."
              />
            </Grid>

            {/* Skills to Gain */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Skills to Gain
              </Typography>
              <TextField
                fullWidth
                label="Add Skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleSkillKeyPress}
                placeholder="Type a skill and press Enter"
                helperText="Press Enter to add skills"
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {trainingProgram.skillsToGain.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => removeSkill(skill)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>

            {/* Cost & Settings */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Cost & Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Training Cost"
                type="number"
                value={trainingProgram.cost}
                onChange={handleInputChange('cost')}
                InputProps={{
                  startAdornment: '₹',
                  inputProps: { min: 0 }
                }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 8
              }}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={trainingProgram.isMandatory}
                      onChange={handleInputChange('isMandatory')}
                    />
                  }
                  label="Mandatory Training"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={trainingProgram.certificateProvided}
                      onChange={handleInputChange('certificateProvided')}
                    />
                  }
                  label="Certificate Provided"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={trainingProgram.isActive}
                      onChange={handleInputChange('isActive')}
                    />
                  }
                  label="Active"
                />
              </Box>
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
                  {loading ? 'Saving...' : isEdit ? 'Update Program' : 'Create Program'}
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

export default TrainingProgramForm;
