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
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

interface EmployeeProfile {
  id: number;
  employeeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  city: string;
  state: string;
  pincode: string;
  photoPath?: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyContactRelation: string;
  personalEmail?: string;
  alternateNumber?: string;
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  bloodGroup?: string;
  manpowerTypeId?: number;
  departmentId?: number;
  designationId?: number;
  workLocationId?: number;
  shiftId?: number;
  joiningDate?: string;
}

const ProfileUpdateForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [profile, setProfile] = useState<EmployeeProfile>({
    id: 1,
    employeeId: 'EMP001',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',
    maritalStatus: 'SINGLE',
    manpowerTypeId: 0,
    departmentId: 0,
    designationId: 0,
    workLocationId: 0,
    shiftId: 0,
    joiningDate: '',
  });

  const [rawPhotoPath, setRawPhotoPath] = useState<string | undefined>(undefined);
  const [originalProfile, setOriginalProfile] = useState<EmployeeProfile>(profile);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurrentEmployeeProfile();
      if (response.success && response.data) {
        const data = response.data;
        const mappedProfile: EmployeeProfile = {
          id: data.id,
          employeeId: data.employeeId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          mobile: data.mobile || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || 'MALE',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          photoPath: data.photoPath ? `${process.env.REACT_APP_API_URL === '/' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3004')}${data.photoPath}` : undefined,
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactNumber: data.emergencyContactNumber || '',
          emergencyContactRelation: data.emergencyContactRelation || '',
          personalEmail: data.personalEmail || '',
          alternateNumber: data.alternateNumber || '',
          maritalStatus: data.maritalStatus || 'SINGLE',
          bloodGroup: data.bloodGroup || '',
          manpowerTypeId: data.manpowerTypeId,
          departmentId: data.departmentId,
          designationId: data.designationId,
          workLocationId: data.workLocationId,
          shiftId: data.shiftId,
          joiningDate: data.joiningDate,
        };
        setRawPhotoPath(data.photoPath);
        setProfile(mappedProfile);
        setOriginalProfile(mappedProfile);
      } else {
        setSnackbar({ open: true, message: response.message || 'Error loading profile', severity: 'error' });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setSnackbar({ open: true, message: 'Error loading profile', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, photoPath: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof EmployeeProfile) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!profile.firstName?.trim()) errors.push('First Name is required');
    if (!profile.lastName?.trim()) errors.push('Last Name is required');
    if (!profile.mobile?.trim()) errors.push('Mobile number is required');
    if (!profile.address?.trim()) errors.push('Address is required');
    if (!profile.city?.trim()) errors.push('City is required');
    if (!profile.state?.trim()) errors.push('State is required');
    if (!profile.pincode?.trim()) errors.push('Pincode is required');
    if (!profile.emergencyContactName?.trim()) errors.push('Emergency Contact Name is required');
    if (!profile.emergencyContactNumber?.trim()) errors.push('Emergency Contact Number is required');

    // Mobile validation
    const mobileRegex = /^[0-9]{10,15}$/;
    if (profile.mobile && !mobileRegex.test(profile.mobile)) {
      errors.push('Please enter a valid mobile number');
    }

    if (profile.emergencyContactNumber && !mobileRegex.test(profile.emergencyContactNumber)) {
      errors.push('Please enter a valid emergency contact number');
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
      const updateData: any = { ...profile };

      // Handle photoPath: if new photo selected, it's handled by updateEmployeeWithPhoto.
      // If not, we should send the raw relative path, not the full URL preview.
      if (selectedPhoto) {
        delete updateData.photoPath;
      } else {
        updateData.photoPath = rawPhotoPath;
      }

      console.log('Submitting profile update:', updateData);

      let response;
      if (selectedPhoto) {
        response = await apiService.updateEmployeeWithPhoto(profile.id, updateData, selectedPhoto);
      } else {
        response = await apiService.updateEmployee(profile.id, updateData);
      }

      if (response.success) {
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        loadProfile(); // Reload to get updated data and paths
        setEditMode(false);
        setSelectedPhoto(null);
      } else {
        console.error('Update failed:', response);
        setSnackbar({ open: true, message: response.message || 'Error updating profile', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ open: true, message: 'Error updating profile. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditMode(false);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          My Profile
        </Typography>
        {!editMode && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit Profile
          </Button>
        )}
      </Box>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Profile Photo Section */}
            <Grid sx={{ textAlign: 'center', mb: 2 }} size={12}>
              <Avatar
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                src={profile.photoPath}
              >
                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
              </Avatar>
              {editMode && (
                <>
                  <IconButton color="primary" component="label">
                    <input hidden accept="image/*" type="file" onChange={handlePhotoChange} />
                    <PhotoCameraIcon />
                  </IconButton>
                  <Typography variant="caption" display="block">
                    Update Photo
                  </Typography>
                </>
              )}
            </Grid>

            {/* Basic Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
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
                label="Employee ID"
                value={profile.employeeId}
                InputProps={{ readOnly: true }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="First Name"
                required
                value={profile.firstName}
                onChange={handleInputChange('firstName')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Last Name"
                required
                value={profile.lastName}
                onChange={handleInputChange('lastName')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Official Email"
                value={profile.email}
                InputProps={{ readOnly: true }}
                variant={editMode ? "outlined" : "standard"}
                helperText="Contact HR to change official email"
              />
            </Grid>



            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Mobile Number"
                required
                value={profile.mobile}
                onChange={handleInputChange('mobile')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Alternate Number"
                value={profile.alternateNumber || ''}
                onChange={handleInputChange('alternateNumber')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={profile.dateOfBirth}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                variant={editMode ? "outlined" : "standard"}
                helperText="Contact HR to change date of birth"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth variant={editMode ? "outlined" : "standard"}>
                <InputLabel id="profile-gender-label" shrink={!!profile.gender || true}>Gender</InputLabel>
                <Select
                  labelId="profile-gender-label"
                  value={profile.gender}
                  label="Gender"
                  onChange={handleInputChange('gender')}
                  disabled={!editMode}
                  displayEmpty
                  renderValue={(selected: any) => {
                    if (!selected || selected === '' || selected === null || selected === undefined) {
                      return <span style={{
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontSize: '0.875rem',
                        display: 'inline-block',
                        overflow: 'visible',
                        textOverflow: 'clip',
                        whiteSpace: 'nowrap',
                        width: '100%'
                      }}>Select Gender</span>;
                    }
                    return <span style={{
                      color: 'rgba(0, 0, 0, 0.87)',
                      fontSize: '0.875rem',
                      display: 'inline-block',
                      overflow: 'visible',
                      textOverflow: 'clip',
                      whiteSpace: 'nowrap'
                    }}>{selected === 'MALE' ? 'Male' : selected === 'FEMALE' ? 'Female' : 'Other'}</span>;
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
                      boxSizing: 'border-box !important',
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
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <FormControl fullWidth variant={editMode ? "outlined" : "standard"}>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  value={profile.maritalStatus}
                  label="Marital Status"
                  onChange={handleInputChange('maritalStatus')}
                  disabled={!editMode}
                >
                  <MenuItem value="SINGLE">Single</MenuItem>
                  <MenuItem value="MARRIED">Married</MenuItem>
                  <MenuItem value="DIVORCED">Divorced</MenuItem>
                  <MenuItem value="WIDOWED">Widowed</MenuItem>
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
                label="Blood Group"
                value={profile.bloodGroup || ''}
                onChange={handleInputChange('bloodGroup')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            {/* Address Information */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                required
                value={profile.address}
                onChange={handleInputChange('address')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="City"
                required
                value={profile.city}
                onChange={handleInputChange('city')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="State"
                required
                value={profile.state}
                onChange={handleInputChange('state')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Pincode"
                required
                value={profile.pincode}
                onChange={handleInputChange('pincode')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            {/* Emergency Contact */}
            <Grid size={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Emergency Contact
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
                label="Emergency Contact Name"
                required
                value={profile.emergencyContactName}
                onChange={handleInputChange('emergencyContactName')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Emergency Contact Number"
                required
                value={profile.emergencyContactNumber}
                onChange={handleInputChange('emergencyContactNumber')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Relationship"
                required
                value={profile.emergencyContactRelation}
                onChange={handleInputChange('emergencyContactRelation')}
                InputProps={{ readOnly: !editMode }}
                variant={editMode ? "outlined" : "standard"}
              />
            </Grid>

            {editMode && (
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
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            )}
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

export default ProfileUpdateForm;
