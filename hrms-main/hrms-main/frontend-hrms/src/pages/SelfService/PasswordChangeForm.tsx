import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: 'error' | 'warning' | 'success';
}

const PasswordChangeForm: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('At least one lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('At least one uppercase letter');

    if (/\d/.test(password)) score += 1;
    else feedback.push('At least one number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('At least one special character');

    let color: 'error' | 'warning' | 'success' = 'error';
    if (score >= 4) color = 'success';
    else if (score >= 3) color = 'warning';

    return { score, feedback, color };
  };

  const passwordStrength = checkPasswordStrength(formData.newPassword);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear alerts when user starts typing
    if (alert) setAlert(null);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.currentPassword) {
      setAlert({ type: 'error', message: 'Current password is required' });
      return false;
    }

    if (!formData.newPassword) {
      setAlert({ type: 'error', message: 'New password is required' });
      return false;
    }

    if (passwordStrength.score < 4) {
      setAlert({ 
        type: 'error', 
        message: `Password is too weak. Missing: ${passwordStrength.feedback.join(', ')}` 
      });
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setAlert({ type: 'error', message: 'New passwords do not match' });
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setAlert({ type: 'error', message: 'New password must be different from current password' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement API call to change password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        setAlert({
          type: 'success',
          message: 'Password changed successfully! Please login again with your new password.',
        });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        setAlert({
          type: 'error',
          message: error.message || 'Failed to change password',
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

  const handleCancel = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setAlert(null);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Lock sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Change Password
          </Typography>
        </Box>

        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Update your password to keep your account secure. Make sure to use a strong password
          that includes a mix of letters, numbers, and special characters.
        </Typography>

        {alert && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 3 }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={handleChange('currentPassword')}
            required
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('current')}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange('newPassword')}
            required
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('new')}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Password Strength:
                </Typography>
                <Typography 
                  variant="body2" 
                  color={passwordStrength.color}
                  sx={{ fontWeight: 'bold' }}
                >
                  {passwordStrength.score < 3 ? 'Weak' : 
                   passwordStrength.score < 4 ? 'Medium' : 'Strong'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength.score / 5) * 100}
                color={passwordStrength.color}
                sx={{ mb: 1 }}
              />
              {passwordStrength.feedback.length > 0 && (
                <Typography variant="caption" color="error">
                  Missing: {passwordStrength.feedback.join(', ')}
                </Typography>
              )}
            </Box>
          )}

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            sx={{ mb: 3 }}
            error={formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword}
            helperText={
              formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword
                ? 'Passwords do not match'
                : ''
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('confirm')}
                    edge="end"
                  >
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Requirements */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Password Requirements:
            </Typography>
            <Box sx={{ pl: 2 }}>
              {[
                'At least 8 characters',
                'At least one lowercase letter',
                'At least one uppercase letter',
                'At least one number',
                'At least one special character (!@#$%^&*)',
              ].map((requirement, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {passwordStrength.score > index ? (
                    <CheckCircle sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  ) : (
                    <Cancel sx={{ fontSize: 16, color: 'error.main', mr: 1 }} />
                  )}
                  <Typography variant="caption" color="textSecondary">
                    {requirement}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || passwordStrength.score < 4 || formData.newPassword !== formData.confirmPassword}
              size="large"
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PasswordChangeForm;
