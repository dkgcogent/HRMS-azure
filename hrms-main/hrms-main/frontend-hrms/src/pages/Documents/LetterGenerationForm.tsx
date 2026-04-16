// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface LetterTemplate {
  id: number;
  name: string;
  type: 'APPOINTMENT' | 'OFFER' | 'RECOMMENDATION' | 'EXPERIENCE' | 'RELIEVING' | 'WARNING' | 'APPRECIATION';
  category: string;
  template: string;
  variables: string[];
  isActive: boolean;
}

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string;
  designationName: string;
  joiningDate: string;
  salary?: number;
  address?: string;
  mobile: string;
}

interface LetterData {
  templateId: number;
  employeeId: number;
  customVariables: Record<string, string>;
  additionalContent?: string;
  recipientEmail?: string;
  subject?: string;
}

const LetterGenerationForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [previewDialog, setPreviewDialog] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [letterData, setLetterData] = useState<LetterData>({
    templateId: 0,
    employeeId: 0,
    customVariables: {},
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  useEffect(() => {
    loadTemplates();
    loadEmployees();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getLetterTemplates();
      // Mock data
      const mockTemplates: LetterTemplate[] = [
        {
          id: 1,
          name: 'Appointment Letter',
          type: 'APPOINTMENT',
          category: 'Joining',
          template: `Dear {{firstName}} {{lastName}},

We are pleased to inform you that you have been selected for the position of {{designationName}} in the {{departmentName}} department at our organization.

Your appointment is effective from {{joiningDate}} with a monthly salary of ₹{{salary}}.

Please report to the HR department on your joining date with the required documents.

We look forward to your valuable contribution to our organization.

Best regards,
HR Department`,
          variables: ['firstName', 'lastName', 'designationName', 'departmentName', 'joiningDate', 'salary'],
          isActive: true,
        },
        {
          id: 2,
          name: 'Offer Letter',
          type: 'OFFER',
          category: 'Recruitment',
          template: `Dear {{firstName}} {{lastName}},

We are delighted to extend an offer for the position of {{designationName}} in our {{departmentName}} department.

Position Details:
- Designation: {{designationName}}
- Department: {{departmentName}}
- Proposed Start Date: {{startDate}}
- Annual CTC: ₹{{annualCTC}}

This offer is valid until {{offerValidTill}}. Please confirm your acceptance by replying to this letter.

We are excited about the possibility of you joining our team.

Best regards,
HR Department`,
          variables: ['firstName', 'lastName', 'designationName', 'departmentName', 'startDate', 'annualCTC', 'offerValidTill'],
          isActive: true,
        },
        {
          id: 3,
          name: 'Experience Certificate',
          type: 'EXPERIENCE',
          category: 'Exit',
          template: `TO WHOM IT MAY CONCERN

This is to certify that {{firstName}} {{lastName}} (Employee ID: {{employeeId}}) was employed with our organization from {{joiningDate}} to {{relievingDate}}.

During the tenure, {{firstName}} worked as {{designationName}} in the {{departmentName}} department and has shown dedication and professionalism in all assigned tasks.

We wish {{firstName}} all the best for future endeavors.

Issued on: {{issueDate}}

HR Department
[Company Name]`,
          variables: ['firstName', 'lastName', 'employeeId', 'joiningDate', 'relievingDate', 'designationName', 'departmentName', 'issueDate'],
          isActive: true,
        },
        {
          id: 4,
          name: 'Recommendation Letter',
          type: 'RECOMMENDATION',
          category: 'Reference',
          template: `TO WHOM IT MAY CONCERN

I am pleased to recommend {{firstName}} {{lastName}} who worked as {{designationName}} in our {{departmentName}} department from {{joiningDate}} to {{relievingDate}}.

{{firstName}} has consistently demonstrated {{qualities}} and has been a valuable team member. {{achievements}}

I highly recommend {{firstName}} for any position that matches their skills and experience.

Please feel free to contact me if you need any additional information.

Best regards,
{{recommenderName}}
{{recommenderDesignation}}
{{contactDetails}}`,
          variables: ['firstName', 'lastName', 'designationName', 'departmentName', 'joiningDate', 'relievingDate', 'qualities', 'achievements', 'recommenderName', 'recommenderDesignation', 'contactDetails'],
          isActive: true,
        },
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
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
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          departmentName: 'Information Technology',
          designationName: 'Software Engineer',
          joiningDate: '2023-01-15',
          salary: 75000,
          address: '123 Main Street, Mumbai',
          mobile: '9876543210',
        },
        {
          id: 2,
          employeeId: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          departmentName: 'Human Resources',
          designationName: 'HR Manager',
          joiningDate: '2022-06-01',
          salary: 85000,
          address: '456 Oak Avenue, Delhi',
          mobile: '9876543211',
        },
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleTemplateChange = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setCustomVariables({});
    setLetterData(prev => ({ ...prev, templateId }));
  };

  const handleEmployeeChange = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employee || null);
    setLetterData(prev => ({ ...prev, employeeId }));

    // Auto-populate variables from employee data
    if (employee && selectedTemplate) {
      const autoVariables: Record<string, string> = {};
      selectedTemplate.variables.forEach(variable => {
        switch (variable) {
          case 'firstName':
            autoVariables[variable] = employee.firstName;
            break;
          case 'lastName':
            autoVariables[variable] = employee.lastName;
            break;
          case 'employeeId':
            autoVariables[variable] = employee.employeeId;
            break;
          case 'designationName':
            autoVariables[variable] = employee.designationName;
            break;
          case 'departmentName':
            autoVariables[variable] = employee.departmentName;
            break;
          case 'joiningDate':
            autoVariables[variable] = new Date(employee.joiningDate).toLocaleDateString();
            break;
          case 'salary':
            autoVariables[variable] = employee.salary?.toLocaleString() || '';
            break;
          case 'issueDate':
            autoVariables[variable] = new Date().toLocaleDateString();
            break;
          default:
            autoVariables[variable] = '';
        }
      });
      setCustomVariables(autoVariables);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setCustomVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generatePreview = () => {
    if (!selectedTemplate || !selectedEmployee) {
      setSnackbar({ open: true, message: 'Please select both template and employee', severity: 'warning' });
      return;
    }

    let content = selectedTemplate.template;

    // Replace variables with actual values
    Object.entries(customVariables).forEach(([variable, value]) => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value || `[${variable}]`);
    });

    setGeneratedContent(content);
    setPreviewDialog(true);
  };

  const downloadLetter = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate?.name}_${selectedEmployee?.employeeId}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendEmail = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.sendLetterByEmail({
      //   to: selectedEmployee?.email,
      //   subject: letterData.subject || selectedTemplate?.name,
      //   content: generatedContent
      // });

      setSnackbar({ open: true, message: 'Letter sent successfully via email!', severity: 'success' });
      setPreviewDialog(false);
    } catch (error) {
      console.error('Error sending email:', error);
      setSnackbar({ open: true, message: 'Error sending email. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveLetter = async () => {
    try {
      setLoading(true);
      // In real app: await apiService.saveGeneratedLetter({
      //   ...letterData,
      //   content: generatedContent,
      //   generatedDate: new Date().toISOString()
      // });

      setSnackbar({ open: true, message: 'Letter saved successfully!', severity: 'success' });
      setPreviewDialog(false);
    } catch (error) {
      console.error('Error saving letter:', error);
      setSnackbar({ open: true, message: 'Error saving letter. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Letter Generation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate automatic letters using predefined templates.
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Template Selection */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DocumentIcon />
              Letter Template
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <FormControl fullWidth required>
              <InputLabel id="letter-template-label" shrink={!!selectedTemplate?.id || true}>Select Template</InputLabel>
              <Select
                labelId="letter-template-label"
                value={selectedTemplate?.id || ''}
                label="Select Template"
                onChange={(e) => handleTemplateChange(e.target.value as number)}
                displayEmpty
                renderValue={(selected: any) => {
                  if (!selected || selected === '' || selected === null || selected === undefined) {
                    return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>Select Template</span>;
                  }
                  const template = templates.find(t => t.id === selected);
                  return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{template?.name || String(selected)}</span>;
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
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    <Box>
                      <Typography variant="body2">{template.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.category} • {template.type}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <FormControl fullWidth required>
              <InputLabel id="letter-employee-label" shrink={!!selectedEmployee?.id || true}>Select Employee</InputLabel>
              <Select
                labelId="letter-employee-label"
                value={selectedEmployee?.id || ''}
                label="Select Employee"
                onChange={(e) => handleEmployeeChange(e.target.value as number)}
                displayEmpty
                renderValue={(selected: any) => {
                  if (!selected || selected === '' || selected === null || selected === undefined) {
                    return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>Select Employee</span>;
                  }
                  const emp = employees.find(e => e.id === selected);
                  return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeId})` : String(selected)}</span>;
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
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    <Box>
                      <Typography variant="body2">
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.departmentName} • {employee.designationName}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Template Variables */}
          {selectedTemplate && (
            <>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Template Variables
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {selectedTemplate.variables.map((variable) => (
                <Grid
                  key={variable}
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label={variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    value={customVariables[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    placeholder={`Enter ${variable}`}
                  />
                </Grid>
              ))}

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Additional Content (Optional)"
                  multiline
                  rows={3}
                  value={letterData.additionalContent || ''}
                  onChange={(e) => setLetterData(prev => ({ ...prev, additionalContent: e.target.value }))}
                  placeholder="Add any additional content to be included in the letter..."
                />
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PreviewIcon />}
                    onClick={generatePreview}
                    disabled={!selectedTemplate || !selectedEmployee}
                  >
                    Preview Letter
                  </Button>
                  <Chip
                    label={`${selectedTemplate.variables.length} variables`}
                    size="small"
                    color="info"
                  />
                  <Chip
                    label={selectedTemplate.category}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Letter Preview - {selectedTemplate?.name}
        </DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 3, mb: 2, backgroundColor: '#fff' }}>
            {(selectedTemplate?.type === 'OFFER' || selectedTemplate?.name.toLowerCase().includes('offer')) && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', borderBottom: '1px solid #eee', pb: 2 }}>
                <img
                  src={`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || 'http://localhost:3004'}`}/uploads/assets/offer_header.png`}
                  alt="Letter Header"
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </Box>
            )}
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
              {generatedContent}
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Email Subject"
                value={letterData.subject || selectedTemplate?.name}
                onChange={(e) => setLetterData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Recipient Email"
                value={letterData.recipientEmail || selectedEmployee?.email}
                onChange={(e) => setLetterData(prev => ({ ...prev, recipientEmail: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          <Button
            startIcon={<SaveIcon />}
            onClick={saveLetter}
            disabled={loading}
          >
            Save Letter
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadLetter}
            variant="outlined"
          >
            Download
          </Button>
          <Button
            startIcon={<SendIcon />}
            onClick={sendEmail}
            variant="contained"
            disabled={loading}
          >
            Send Email
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

export default LetterGenerationForm;
