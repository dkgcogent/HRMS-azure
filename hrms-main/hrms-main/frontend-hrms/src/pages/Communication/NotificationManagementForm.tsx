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
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Send as SendIcon,
  Notifications as NotificationIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Cake as BirthdayIcon,
  Event as EventIcon,
  Warning as ReminderIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

interface NotificationTemplate {
  id?: number;
  name: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'LEAVE_REMINDER' | 'POLICY_UPDATE' | 'TRAINING_REMINDER' | 'CUSTOM';
  subject: string;
  content: string;
  channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  recipients: 'ALL' | 'MANAGERS' | 'HR' | 'SPECIFIC';
  specificRecipients?: number[];
  isActive: boolean;
  variables: string[];
  schedule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
    time: string;
    daysBefore?: number;
  };
}

interface NotificationHistory {
  id: number;
  templateId: number;
  templateName: string;
  sentDate: string;
  sentTime: string;
  recipients: string[];
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  status: 'SENT' | 'FAILED' | 'PENDING';
  subject: string;
  content: string;
  errorMessage?: string;
}

interface BirthdayReminder {
  id: number;
  employeeId: number;
  employeeName: string;
  birthDate: string;
  department: string;
  daysUntilBirthday: number;
  notificationSent: boolean;
  managerNotified: boolean;
}

interface NotificationSettings {
  birthdayReminders: {
    enabled: boolean;
    daysBefore: number;
    notifyManagers: boolean;
    notifyHR: boolean;
    channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  };
  anniversaryReminders: {
    enabled: boolean;
    daysBefore: number;
    notifyManagers: boolean;
    channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  };
  leaveReminders: {
    enabled: boolean;
    pendingApprovalHours: number;
    unusedLeaveMonths: number;
    channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  };
  policyUpdates: {
    enabled: boolean;
    requireAcknowledgment: boolean;
    reminderFrequency: number;
    channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  };
}

const notificationTypes = [
  { value: 'BIRTHDAY', label: 'Birthday Reminder', icon: <BirthdayIcon /> },
  { value: 'ANNIVERSARY', label: 'Work Anniversary', icon: <EventIcon /> },
  { value: 'LEAVE_REMINDER', label: 'Leave Reminder', icon: <ReminderIcon /> },
  { value: 'POLICY_UPDATE', label: 'Policy Update', icon: <NotificationIcon /> },
  { value: 'TRAINING_REMINDER', label: 'Training Reminder', icon: <ReminderIcon /> },
  { value: 'CUSTOM', label: 'Custom Notification', icon: <NotificationIcon /> },
];

const NotificationManagementForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sendingTemplateId, setSendingTemplateId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayReminder[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    birthdayReminders: {
      enabled: true,
      daysBefore: 1,
      notifyManagers: true,
      notifyHR: true,
      channels: ['EMAIL', 'IN_APP'],
    },
    anniversaryReminders: {
      enabled: true,
      daysBefore: 3,
      notifyManagers: true,
      channels: ['EMAIL', 'IN_APP'],
    },
    leaveReminders: {
      enabled: true,
      pendingApprovalHours: 24,
      unusedLeaveMonths: 3,
      channels: ['EMAIL'],
    },
    policyUpdates: {
      enabled: true,
      requireAcknowledgment: true,
      reminderFrequency: 7,
      channels: ['EMAIL', 'IN_APP'],
    },
  });

  const emptyTemplate: NotificationTemplate = {
    name: '',
    type: 'CUSTOM',
    subject: '',
    content: '',
    channels: ['EMAIL'],
    recipients: 'ALL',
    isActive: true,
    variables: [],
  };

  const [newTemplate, setNewTemplate] = useState<NotificationTemplate>(emptyTemplate);

  useEffect(() => {
    loadTemplates();
    loadHistory();
    loadBirthdays();
    loadEmployees();
    loadSettings();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotificationTemplates();
      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await apiService.getNotificationSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await apiService.getNotificationHistory();
      if (response.success) {
        setHistory(response.data || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadBirthdays = async () => {
    try {
      const response = await apiService.getUpcomingBirthdays();
      if (response.success) {
        setBirthdays(response.data || []);
      }
    } catch (error) {
      console.error('Error loading birthdays:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees(1, 1000);
      if (response.success) {
        setEmployees(response.data.content || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleTemplateChange = (field: keyof NotificationTemplate, value: any) => {
    setNewTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (category: keyof NotificationSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const addVariable = (variable: string) => {
    if (variable && !newTemplate.variables.includes(variable)) {
      setNewTemplate(prev => ({
        ...prev,
        variables: [...prev.variables, variable]
      }));
    }
  };

  const removeVariable = (variable: string) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  // Open dialog for creating a new template
  const handleOpenCreateDialog = () => {
    setEditingTemplate(null);
    setNewTemplate(emptyTemplate);
    setTemplateDialog(true);
  };

  // Open dialog pre-populated for editing
  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content,
      channels: template.channels || ['EMAIL'],
      recipients: template.recipients || 'ALL',
      isActive: template.isActive !== false,
      variables: template.variables || [],
    });
    setTemplateDialog(true);
  };

  // Send a template immediately and log to notification_history
  const handleSendTemplate = async (template: NotificationTemplate) => {
    if (!template.id) return;
    try {
      setSendingTemplateId(template.id as number);
      const response = await apiService.sendNotificationTemplate(template.id as number);
      if (response.success) {
        setSnackbar({ open: true, message: response.message || 'Notification sent successfully!', severity: 'success' });
        // Reload history so the new records appear in the History tab
        loadHistory();
      } else {
        setSnackbar({ open: true, message: response.message || 'Error sending notification', severity: 'error' });
      }
    } catch (error) {
      console.error('Error sending template:', error);
      setSnackbar({ open: true, message: 'Error sending notification', severity: 'error' });
    } finally {
      setSendingTemplateId(null);
    }
  };

  const submitTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      let response;

      if (editingTemplate && editingTemplate.id) {
        // Update existing template
        response = await apiService.updateNotificationTemplate(editingTemplate.id as number, newTemplate as any);
        if (response.success) {
          setSnackbar({ open: true, message: 'Notification template updated successfully!', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: response.message || 'Error updating template', severity: 'error' });
        }
      } else {
        // Create new template
        response = await apiService.createNotificationTemplate(newTemplate as any);
        if (response.success) {
          setSnackbar({ open: true, message: 'Notification template created successfully!', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: response.message || 'Error creating template', severity: 'error' });
        }
      }

      if (response.success) {
        setTemplateDialog(false);
        setEditingTemplate(null);
        setNewTemplate(emptyTemplate);
        loadTemplates();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSnackbar({ open: true, message: 'Error saving template', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.updateNotificationSetting(1, settings);
      if (response.success) {
        setSnackbar({ open: true, message: 'Notification settings saved successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.message || 'Error saving settings', severity: 'error' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: 'Error saving settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const sendBirthdayReminders = async () => {
    try {
      setLoading(true);
      const response = await apiService.sendBirthdayReminders();
      if (response.success) {
        setSnackbar({ open: true, message: response.message || 'Birthday reminders sent successfully!', severity: 'success' });
        loadBirthdays();
        loadHistory();
      } else {
        setSnackbar({ open: true, message: response.message || 'Error sending reminders', severity: 'error' });
      }
    } catch (error) {
      console.error('Error sending birthday reminders:', error);
      setSnackbar({ open: true, message: 'Error sending birthday reminders', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'success';
      case 'FAILED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return <EmailIcon />;
      case 'SMS': return <SmsIcon />;
      case 'IN_APP': return <NotificationIcon />;
      default: return <NotificationIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Notification & Communication Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage automated notifications, birthday reminders, and communication templates.
      </Typography>
      {/* Tab Navigation */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0 }}>
            {[
              { id: 'templates', label: 'Templates', icon: <NotificationIcon /> },
              { id: 'birthdays', label: 'Birthday Reminders', icon: <BirthdayIcon /> },
              { id: 'history', label: 'History', icon: <EmailIcon /> },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
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
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Notification Templates</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDialog}
                >
                  Create Template
                </Button>
              </Box>

              <Grid container spacing={3}>
                {templates.map((template) => (
                  <Grid
                    key={template.id}
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
                              {notificationTypes.find(t => t.value === template.type)?.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{template.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {notificationTypes.find(t => t.value === template.type)?.label}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={template.isActive ? 'Active' : 'Inactive'}
                            color={template.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Subject:</strong> {template.subject}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          <strong>Content:</strong> {template.content}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {template.channels.map((channel) => (
                            <Chip
                              key={channel}
                              label={channel}
                              icon={getChannelIcon(channel)}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditTemplate(template)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<SendIcon />}
                            onClick={() => handleSendTemplate(template)}
                            disabled={sendingTemplateId === template.id}
                          >
                            {sendingTemplateId === template.id ? 'Sending...' : 'Send'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Birthday Reminders Tab */}
          {activeTab === 'birthdays' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Upcoming Birthdays</Typography>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={sendBirthdayReminders}
                  disabled={loading}
                >
                  Send Reminders
                </Button>
              </Box>

              <List>
                {birthdays.map((birthday) => (
                  <ListItem key={birthday.id}>
                    <ListItemAvatar>
                      <Badge
                        badgeContent={birthday.daysUntilBirthday === 0 ? 'Today!' : birthday.daysUntilBirthday}
                        color={birthday.daysUntilBirthday === 0 ? 'error' : birthday.daysUntilBirthday <= 3 ? 'warning' : 'primary'}
                      >
                        <Avatar>
                          <BirthdayIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={birthday.employeeName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {birthday.department} • {new Date(birthday.birthDate).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {birthday.notificationSent && (
                              <Chip label="Notification Sent" color="success" size="small" />
                            )}
                            {birthday.managerNotified && (
                              <Chip label="Manager Notified" color="info" size="small" />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => sendBirthdayReminders()}>
                        <SendIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {birthdays.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No upcoming birthdays in the next 30 days.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification History
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Template</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Channel</TableCell>
                      <TableCell>Recipients</TableCell>
                      <TableCell>Sent Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.templateName}</TableCell>
                        <TableCell>{record.subject}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getChannelIcon(record.channel)}
                            {record.channel}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {record.recipients ? record.recipients.length : 0} recipient(s)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(record.sentDate).toLocaleDateString()} {record.sentTime}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.status}
                            color={getStatusColor(record.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>

              <Grid container spacing={3}>
                {/* Birthday Reminders Settings */}
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BirthdayIcon />
                        Birthday Reminders
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.birthdayReminders.enabled}
                            onChange={(e) => handleSettingsChange('birthdayReminders', 'enabled', e.target.checked)}
                          />
                        }
                        label="Enable Birthday Reminders"
                      />
                      <TextField
                        fullWidth
                        label="Days Before Birthday"
                        type="number"
                        value={settings.birthdayReminders.daysBefore}
                        onChange={(e) => handleSettingsChange('birthdayReminders', 'daysBefore', parseInt(e.target.value))}
                        sx={{ mt: 2 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.birthdayReminders.notifyManagers}
                            onChange={(e) => handleSettingsChange('birthdayReminders', 'notifyManagers', e.target.checked)}
                          />
                        }
                        label="Notify Managers"
                        sx={{ mt: 2 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.birthdayReminders.notifyHR}
                            onChange={(e) => handleSettingsChange('birthdayReminders', 'notifyHR', e.target.checked)}
                          />
                        }
                        label="Notify HR"
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Anniversary Reminders Settings */}
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon />
                        Anniversary Reminders
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.anniversaryReminders.enabled}
                            onChange={(e) => handleSettingsChange('anniversaryReminders', 'enabled', e.target.checked)}
                          />
                        }
                        label="Enable Anniversary Reminders"
                      />
                      <TextField
                        fullWidth
                        label="Days Before Anniversary"
                        type="number"
                        value={settings.anniversaryReminders.daysBefore}
                        onChange={(e) => handleSettingsChange('anniversaryReminders', 'daysBefore', parseInt(e.target.value))}
                        sx={{ mt: 2 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.anniversaryReminders.notifyManagers}
                            onChange={(e) => handleSettingsChange('anniversaryReminders', 'notifyManagers', e.target.checked)}
                          />
                        }
                        label="Notify Managers"
                        sx={{ mt: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Leave Reminders Settings */}
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReminderIcon />
                        Leave Reminders
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.leaveReminders.enabled}
                            onChange={(e) => handleSettingsChange('leaveReminders', 'enabled', e.target.checked)}
                          />
                        }
                        label="Enable Leave Reminders"
                      />
                      <TextField
                        fullWidth
                        label="Pending Approval Hours"
                        type="number"
                        value={settings.leaveReminders.pendingApprovalHours}
                        onChange={(e) => handleSettingsChange('leaveReminders', 'pendingApprovalHours', parseInt(e.target.value))}
                        sx={{ mt: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Unused Leave Reminder (Months)"
                        type="number"
                        value={settings.leaveReminders.unusedLeaveMonths}
                        onChange={(e) => handleSettingsChange('leaveReminders', 'unusedLeaveMonths', parseInt(e.target.value))}
                        sx={{ mt: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Policy Updates Settings */}
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationIcon />
                        Policy Updates
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.policyUpdates.enabled}
                            onChange={(e) => handleSettingsChange('policyUpdates', 'enabled', e.target.checked)}
                          />
                        }
                        label="Enable Policy Update Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.policyUpdates.requireAcknowledgment}
                            onChange={(e) => handleSettingsChange('policyUpdates', 'requireAcknowledgment', e.target.checked)}
                          />
                        }
                        label="Require Acknowledgment"
                        sx={{ mt: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Reminder Frequency (Days)"
                        type="number"
                        value={settings.policyUpdates.reminderFrequency}
                        onChange={(e) => handleSettingsChange('policyUpdates', 'reminderFrequency', parseInt(e.target.value))}
                        sx={{ mt: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={saveSettings}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
      {/* Create Template Dialog */}
      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Notification Template' : 'Create Notification Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Template Name"
                required
                value={newTemplate.name}
                onChange={(e) => handleTemplateChange('name', e.target.value)}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth required>
                <InputLabel>Template Type</InputLabel>
                <Select
                  value={newTemplate.type}
                  label="Template Type"
                  onChange={(e) => handleTemplateChange('type', e.target.value)}
                >
                  {notificationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Subject"
                required
                value={newTemplate.subject}
                onChange={(e) => handleTemplateChange('subject', e.target.value)}
                placeholder="e.g., Happy Birthday {{employeeName}}!"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={6}
                required
                value={newTemplate.content}
                onChange={(e) => handleTemplateChange('content', e.target.value)}
                placeholder="Enter the notification content. Use {{variableName}} for dynamic content."
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth>
                <InputLabel>Recipients</InputLabel>
                <Select
                  value={newTemplate.recipients}
                  label="Recipients"
                  onChange={(e) => handleTemplateChange('recipients', e.target.value)}
                >
                  <MenuItem value="ALL">All Employees</MenuItem>
                  <MenuItem value="MANAGERS">Managers Only</MenuItem>
                  <MenuItem value="HR">HR Team</MenuItem>
                  <MenuItem value="SPECIFIC">Specific Employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth>
                <InputLabel>Channels</InputLabel>
                <Select
                  multiple
                  value={newTemplate.channels}
                  label="Channels"
                  onChange={(e) => handleTemplateChange('channels', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="IN_APP">In-App Notification</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">
                Available variables: {newTemplate.variables.join(', ') || 'None'}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitTemplate} disabled={loading}>
            {loading ? (editingTemplate ? 'Saving...' : 'Creating...') : (editingTemplate ? 'Save Changes' : 'Create Template')}
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

export default NotificationManagementForm;
