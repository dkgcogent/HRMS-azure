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
  Divider,
  IconButton,
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
  Chip,
  Alert,
  Snackbar,
  Avatar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  FamilyRestroom as FamilyIcon,
  LocalHospital as MedicalIcon,
  ContactPhone as EmergencyIcon,
  Inventory as AssetIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

interface FamilyMember {
  id?: number;
  name: string;
  relationship: string;
  dateOfBirth: string;
  occupation?: string;
  contactNumber?: string;
  isDependent: boolean;
  isNominee: boolean;
}

interface EmergencyContact {
  id?: number;
  name: string;
  relationship: string;
  primaryPhone: string;
  secondaryPhone?: string;
  address: string;
  isPrimary: boolean;
}

interface MedicalInfo {
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  emergencyMedicalInfo?: string;
  lastCheckupDate?: string;
  doctorName?: string;
  doctorContact?: string;
}

interface EnhancedProfileData {
  employeeId: number;
  name?: string;
  photoPath?: string;
  personalInfo: {
    anniversaryDate?: string;
    spouseName?: string;
    children?: number;
    hobbies?: string;
    languages?: string[];
    personalEmail?: string;
    alternateNumber?: string;
    maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
    bloodGroup?: string;
    email?: string;
    mobile?: string;
    address?: string;
  };
  familyMembers: FamilyMember[];
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
}

const relationshipTypes = [
  'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister',
  'Father-in-law', 'Mother-in-law', 'Uncle', 'Aunt', 'Cousin', 'Friend', 'Other'
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const commonAllergies = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk', 'Soy', 'Wheat',
  'Dust', 'Pollen', 'Pet Dander', 'Latex', 'Medications', 'Insect Stings'
];

const EnhancedEmployeeProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [familyDialog, setFamilyDialog] = useState(false);
  const [emergencyDialog, setEmergencyDialog] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState<EmergencyContact | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [profile, setProfile] = useState<EnhancedProfileData>({
    employeeId: parseInt(id || '0'),
    personalInfo: {
      children: 0,
      languages: [],
    },
    familyMembers: [],
    emergencyContacts: [],
    medicalInfo: {
      bloodGroup: '',
      allergies: [],
      chronicConditions: [],
      medications: [],
    },
  });

  const [rawEmployeeData, setRawEmployeeData] = useState<any>(null);

  const [newFamily, setNewFamily] = useState<FamilyMember>({
    name: '',
    relationship: '',
    dateOfBirth: '',
    isDependent: false,
    isNominee: false,
  });

  const [newEmergency, setNewEmergency] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    primaryPhone: '',
    address: '',
    isPrimary: false,
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [assignedAssets, setAssignedAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const loadAssignedAssets = React.useCallback(async (employeeId: number) => {
    try {
      setLoadingAssets(true);
      const response = await apiService.getAssetsByEmployee(employeeId);
      if (response.success && response.data) {
        setAssignedAssets(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading assigned assets:', error);
      setAssignedAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  const loadEmployeeProfile = React.useCallback(async (employeeId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getEmployeeById(employeeId);
      if (response.success && response.data) {
        const data = response.data;
        setRawEmployeeData(data);

        // Map real employee data to the profile structure
        const realProfile: EnhancedProfileData = {
          employeeId: data.id,
          name: `${data.firstName} ${data.lastName}`,
          photoPath: data.photoPath,
          personalInfo: {
            personalEmail: data.personalEmail || '',
            alternateNumber: data.alternateNumber || '',
            maritalStatus: data.maritalStatus || 'SINGLE',
            bloodGroup: data.bloodGroup || '',
            email: data.email || '',
            mobile: data.mobile || '',
            address: `${data.address || ''}, ${data.city || ''}, ${data.state || ''} ${data.pincode || ''}`,
          },
          familyMembers: [], // Keep mock for now or implement separate table
          emergencyContacts: [
            {
              id: 1,
              name: data.emergencyContactName || 'Not Set',
              relationship: data.emergencyContactRelation || '-',
              primaryPhone: data.emergencyContactNumber || '-',
              address: 'Address in Profile',
              isPrimary: true,
            }
          ],
          medicalInfo: {
            bloodGroup: data.bloodGroup || '',
            allergies: [],
            chronicConditions: [],
            medications: [],
          },
        };
        setProfile(realProfile);
      }
    } catch (error) {
      console.error('Error loading employee profile:', error);
      setSnackbar({ open: true, message: 'Error loading profile', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      const empId = parseInt(id);
      loadEmployeeProfile(empId);
      loadAssignedAssets(empId);
    }
  }, [id, loadEmployeeProfile, loadAssignedAssets]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const updateData = {
        ...(rawEmployeeData || {}),
        personalEmail: profile.personalInfo.personalEmail,
        alternateNumber: profile.personalInfo.alternateNumber,
        maritalStatus: profile.personalInfo.maritalStatus,
        bloodGroup: profile.personalInfo.bloodGroup,
        emergencyContactName: profile.emergencyContacts[0]?.name,
        emergencyContactNumber: profile.emergencyContacts[0]?.primaryPhone,
        emergencyContactRelation: profile.emergencyContacts[0]?.relationship,
      };

      const response = await apiService.updateEmployee(parseInt(id!), updateData);
      if (response.success) {
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        loadEmployeeProfile(parseInt(id!));
      } else {
        setSnackbar({ open: true, message: response.message || 'Error updating profile', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ open: true, message: 'Error updating profile', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleMedicalInfoChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [field]: value
      }
    }));
  };

  const addFamilyMember = () => {
    if (!newFamily.name || !newFamily.relationship || !newFamily.dateOfBirth) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    setProfile(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { ...newFamily, id: Date.now() }]
    }));

    setNewFamily({
      name: '',
      relationship: '',
      dateOfBirth: '',
      isDependent: false,
      isNominee: false,
    });
    setFamilyDialog(false);
  };

  const addEmergencyContact = () => {
    if (!newEmergency.name || !newEmergency.relationship || !newEmergency.primaryPhone || !newEmergency.address) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    if (editingEmergency) {
      setProfile(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.map(c => c.id === editingEmergency.id ? { ...newEmergency } : c)
      }));
      setEditingEmergency(null);
    } else {
      setProfile(prev => ({
        ...prev,
        emergencyContacts: [...prev.emergencyContacts, { ...newEmergency, id: Date.now() }]
      }));
    }

    setNewEmergency({
      name: '',
      relationship: '',
      primaryPhone: '',
      address: '',
      isPrimary: false,
    });
    setEmergencyDialog(false);
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !profile.medicalInfo.allergies.includes(newAllergy.trim())) {
      handleMedicalInfoChange('allergies', [...profile.medicalInfo.allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    handleMedicalInfoChange('allergies', profile.medicalInfo.allergies.filter(a => a !== allergy));
  };

  const addCondition = () => {
    if (newCondition.trim() && !profile.medicalInfo.chronicConditions.includes(newCondition.trim())) {
      handleMedicalInfoChange('chronicConditions', [...profile.medicalInfo.chronicConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    handleMedicalInfoChange('chronicConditions', profile.medicalInfo.chronicConditions.filter(c => c !== condition));
  };

  const addMedication = () => {
    if (newMedication.trim() && !profile.medicalInfo.medications.includes(newMedication.trim())) {
      handleMedicalInfoChange('medications', [...profile.medicalInfo.medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    handleMedicalInfoChange('medications', profile.medicalInfo.medications.filter(m => m !== medication));
  };



  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Enhanced Employee Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage comprehensive employee information including family, emergency contacts, and medical details.
      </Typography>
      {/* Tab Navigation */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0 }}>
            {[
              { id: 'personal', label: 'Personal Info', icon: <PersonIcon /> },
              { id: 'family', label: 'Family Members', icon: <FamilyIcon /> },
              { id: 'emergency', label: 'Emergency Contacts', icon: <EmergencyIcon /> },
              { id: 'medical', label: 'Medical Info', icon: <MedicalIcon /> },
              { id: 'assets', label: 'Assigned Assets', icon: <AssetIcon /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'contained' : 'text'}
                startIcon={tab.icon}
                sx={{ borderRadius: 0, minWidth: 150 }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Additional Personal Information
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
                  label="Anniversary Date"
                  type="date"
                  value={profile.personalInfo.anniversaryDate || ''}
                  onChange={(e) => handlePersonalInfoChange('anniversaryDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Spouse Name"
                  value={profile.personalInfo.spouseName || ''}
                  onChange={(e) => handlePersonalInfoChange('spouseName', e.target.value)}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Number of Children"
                  type="number"
                  value={profile.personalInfo.children || 0}
                  onChange={(e) => handlePersonalInfoChange('children', parseInt(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Hobbies & Interests"
                  value={profile.personalInfo.hobbies || ''}
                  onChange={(e) => handlePersonalInfoChange('hobbies', e.target.value)}
                  placeholder="e.g., Reading, Swimming, Photography"
                />
              </Grid>



              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Alternate Number"
                  value={profile.personalInfo.alternateNumber || ''}
                  onChange={(e) => handlePersonalInfoChange('alternateNumber', e.target.value)}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <FormControl fullWidth>
                  <InputLabel>Marital Status</InputLabel>
                  <Select
                    value={profile.personalInfo.maritalStatus || 'SINGLE'}
                    label="Marital Status"
                    onChange={(e) => handlePersonalInfoChange('maritalStatus', e.target.value)}
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
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Blood Group"
                  value={profile.personalInfo.bloodGroup || ''}
                  onChange={(e) => handlePersonalInfoChange('bloodGroup', e.target.value)}
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
                  value={profile.personalInfo.email || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Official Mobile"
                  value={profile.personalInfo.mobile || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Official Address"
                  value={profile.personalInfo.address || ''}
                  InputProps={{ readOnly: true }}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Languages Known"
                  value={profile.personalInfo.languages?.join(', ') || ''}
                  onChange={(e) => handlePersonalInfoChange('languages', e.target.value.split(',').map(l => l.trim()))}
                  placeholder="e.g., English, Hindi, Spanish"
                  helperText="Separate multiple languages with commas"
                />
              </Grid>
            </Grid>
          )}

          {/* Family Members Tab */}
          {activeTab === 'family' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Family Members</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setFamilyDialog(true)}
                >
                  Add Family Member
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Relationship</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Occupation</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profile.familyMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.relationship}</TableCell>
                        <TableCell>{calculateAge(member.dateOfBirth)} years</TableCell>
                        <TableCell>{member.occupation || '-'}</TableCell>
                        <TableCell>{member.contactNumber || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {member.isDependent && <Chip label="Dependent" size="small" color="primary" />}
                            {member.isNominee && <Chip label="Nominee" size="small" color="secondary" />}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {profile.familyMembers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No family members added yet.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Emergency Contacts Tab */}
          {activeTab === 'emergency' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Emergency Contacts</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEmergencyDialog(true)}
                >
                  Add Emergency Contact
                </Button>
              </Box>

              <Grid container spacing={2}>
                {profile.emergencyContacts.map((contact) => (
                  <Grid
                    key={contact.id}
                    size={{
                      xs: 12,
                      md: 6
                    }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar>{contact.name.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="h6">{contact.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {contact.relationship}
                              </Typography>
                              {contact.isPrimary && <Chip label="Primary" size="small" color="primary" />}
                            </Box>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setEditingEmergency(contact);
                                setNewEmergency(contact);
                                setEmergencyDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2"><strong>Primary:</strong> {contact.primaryPhone}</Typography>
                        {contact.secondaryPhone && (
                          <Typography variant="body2"><strong>Secondary:</strong> {contact.secondaryPhone}</Typography>
                        )}
                        <Typography variant="body2"><strong>Address:</strong> {contact.address}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {profile.emergencyContacts.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No emergency contacts added yet.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Medical Information Tab */}
          {activeTab === 'medical' && (
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Medical Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4
                }}>
                <FormControl fullWidth>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    value={profile.medicalInfo.bloodGroup}
                    label="Blood Group"
                    onChange={(e) => handleMedicalInfoChange('bloodGroup', e.target.value)}
                  >
                    {bloodGroups.map((group) => (
                      <MenuItem key={group} value={group}>{group}</MenuItem>
                    ))}
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
                  label="Last Checkup Date"
                  type="date"
                  value={profile.medicalInfo.lastCheckupDate || ''}
                  onChange={(e) => handleMedicalInfoChange('lastCheckupDate', e.target.value)}
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
                  label="Doctor Name"
                  value={profile.medicalInfo.doctorName || ''}
                  onChange={(e) => handleMedicalInfoChange('doctorName', e.target.value)}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Doctor Contact"
                  value={profile.medicalInfo.doctorContact || ''}
                  onChange={(e) => handleMedicalInfoChange('doctorContact', e.target.value)}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  fullWidth
                  label="Emergency Medical Info"
                  value={profile.medicalInfo.emergencyMedicalInfo || ''}
                  onChange={(e) => handleMedicalInfoChange('emergencyMedicalInfo', e.target.value)}
                  placeholder="Critical medical information for emergencies"
                />
              </Grid>

              {/* Allergies */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Allergies</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Common Allergies</InputLabel>
                    <Select
                      value=""
                      label="Common Allergies"
                      onChange={(e) => {
                        if (e.target.value && !profile.medicalInfo.allergies.includes(e.target.value as string)) {
                          handleMedicalInfoChange('allergies', [...profile.medicalInfo.allergies, e.target.value]);
                        }
                      }}
                    >
                      {commonAllergies.map((allergy) => (
                        <MenuItem key={allergy} value={allergy}>{allergy}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Custom Allergy"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                  />
                  <Button variant="outlined" onClick={addAllergy}>Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.medicalInfo.allergies.map((allergy, index) => (
                    <Chip
                      key={index}
                      label={allergy}
                      onDelete={() => removeAllergy(allergy)}
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Chronic Conditions */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Chronic Conditions</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label="Add Condition"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button variant="outlined" onClick={addCondition}>Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.medicalInfo.chronicConditions.map((condition, index) => (
                    <Chip
                      key={index}
                      label={condition}
                      onDelete={() => removeCondition(condition)}
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Current Medications */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Current Medications</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label="Add Medication"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                    placeholder="e.g., Aspirin 100mg daily"
                  />
                  <Button variant="outlined" onClick={addMedication}>Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.medicalInfo.medications.map((medication, index) => (
                    <Chip
                      key={index}
                      label={medication}
                      onDelete={() => removeMedication(medication)}
                      color="info"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Assigned Assets Tab */}
          {activeTab === 'assets' && (
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Company Assigned Assets
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Assets assigned to this employee by the company. Managers and Admins can view and manage these assignments.
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {loadingAssets ? (
                <Grid size={12}>
                  <Typography>Loading assets...</Typography>
                </Grid>
              ) : assignedAssets.length === 0 ? (
                <Grid size={12}>
                  <Alert severity="info">
                    No assets are currently assigned to this employee.
                  </Alert>
                </Grid>
              ) : (
                assignedAssets.map((asset) => (
                  <Grid size={{ xs: 12, md: 6 }} key={asset.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {asset.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Asset ID: {asset.assetId}
                            </Typography>
                          </Box>
                          <Chip
                            label={asset.status}
                            color={asset.status === 'ASSIGNED' ? 'primary' : 'default'}
                            size="small"
                          />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Category</Typography>
                            <Typography variant="body2">{asset.category?.replace('_', ' ') || 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Type</Typography>
                            <Typography variant="body2">{asset.type || 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Brand</Typography>
                            <Typography variant="body2">{asset.brand || 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Model</Typography>
                            <Typography variant="body2">{asset.model || 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Condition</Typography>
                            <Typography variant="body2">{asset.condition || 'N/A'}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Assigned Date</Typography>
                            <Typography variant="body2">
                              {asset.assignmentDate ? new Date(asset.assignmentDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </Grid>
                          {asset.serialNumber && (
                            <Grid size={12}>
                              <Typography variant="caption" color="text.secondary">Serial Number</Typography>
                              <Typography variant="body2">{asset.serialNumber}</Typography>
                            </Grid>
                          )}
                          {asset.location && (
                            <Grid size={12}>
                              <Typography variant="caption" color="text.secondary">Location</Typography>
                              <Typography variant="body2">{asset.location}</Typography>
                            </Grid>
                          )}
                        </Grid>

                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          )}
        </Box>
      </Paper>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/employees')}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </Box>
      {/* Family Member Dialog */}
      <Dialog open={familyDialog} onClose={() => setFamilyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Family Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Name"
                required
                value={newFamily.name}
                onChange={(e) => setNewFamily(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={newFamily.relationship}
                  label="Relationship"
                  onChange={(e) => setNewFamily(prev => ({ ...prev, relationship: e.target.value }))}
                >
                  {relationshipTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                required
                value={newFamily.dateOfBirth}
                onChange={(e) => setNewFamily(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Occupation"
                value={newFamily.occupation || ''}
                onChange={(e) => setNewFamily(prev => ({ ...prev, occupation: e.target.value }))}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Contact Number"
                value={newFamily.contactNumber || ''}
                onChange={(e) => setNewFamily(prev => ({ ...prev, contactNumber: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFamilyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addFamilyMember}>Add</Button>
        </DialogActions>
      </Dialog>
      {/* Emergency Contact Dialog */}
      <Dialog open={emergencyDialog} onClose={() => setEmergencyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Emergency Contact</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Name"
                required
                value={newEmergency.name}
                onChange={(e) => setNewEmergency(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={newEmergency.relationship}
                  label="Relationship"
                  onChange={(e) => setNewEmergency(prev => ({ ...prev, relationship: e.target.value }))}
                >
                  {relationshipTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Primary Phone"
                required
                value={newEmergency.primaryPhone}
                onChange={(e) => setNewEmergency(prev => ({ ...prev, primaryPhone: e.target.value }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Secondary Phone"
                value={newEmergency.secondaryPhone || ''}
                onChange={(e) => setNewEmergency(prev => ({ ...prev, secondaryPhone: e.target.value }))}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Address"
                required
                multiline
                rows={2}
                value={newEmergency.address}
                onChange={(e) => setNewEmergency(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addEmergencyContact}>Add</Button>
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

export default EnhancedEmployeeProfile;
