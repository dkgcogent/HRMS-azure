// @ts-nocheck
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
  Avatar,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  LockOutlined as LockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);

      // Real API authentication
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update context + localStorage
        authLogin(data.token, data.role, data.fullName || data.username, data.employeeId);
        localStorage.setItem('username', data.username);
        // Role-based redirect
        let redirectPath = '/dashboard';
        if (data.role === 'employee') {
          redirectPath = '/tasks/my'; // Employee task dashboard
        } else if (data.role === 'hr') {
          redirectPath = '/tasks/hr'; // HR task dashboard
        } else if (data.role === 'admin') {
          redirectPath = '/tasks/admin'; // Admin task dashboard
        }
        navigate(redirectPath);
        return;
      }

      // Handle different error responses
      let errorMessage = '';
      let errorJson: any = null;
      try {
        // Try to parse as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorJson = await response.json();
          errorMessage = errorJson.error || errorJson.message || 'Login failed';
        } else {
          errorMessage = await response.text();
        }
      } catch (e) {
        errorMessage = 'Failed to read error response';
      }

      if (response.status === 0) {
        setError(`Backend server is not responding. Please ensure the server is running on ${API_BASE_URL}`);
        return;
      }

      if (response.status >= 500) {
        try {
          if (errorJson && (errorJson.code || errorJson.details)) {
            console.error('Detailed Server Error:', errorJson);
            setError(`Server Error (${response.status}): ${errorMessage} | Code: ${errorJson.code} | Details: ${JSON.stringify(errorJson.details)}`);
            return;
          }
        } catch (e) {}
        setError(`Server Error (${response.status}): ${errorMessage}`);
        return;
      }

      if (response.status === 404) {
        setError('Login endpoint not found. Please check if the backend server is running correctly.');
        return;
      }

      if (response.status === 401) {
        setError(errorMessage || 'Invalid username or password');
        return;
      }

      if (response.status === 503) {
        setError('Database connection failed. Please check database configuration and ensure MySQL is running.');
        return;
      }

      // Fallback for dev if backend route not available (e.g., 404 Cannot POST)
      const u = formData.username.trim();
      const p = formData.password;
      const isEmployee = u === 'employee1' && p === 'emp123';
      const isHR = u === 'hr1' && p === 'hr123';
      const isAdmin = u === 'admin' && p === 'admin123';
      if (errorMessage.includes('Cannot POST /api/auth/login') && (isEmployee || isHR || isAdmin)) {
        const role = isEmployee ? 'employee' : isHR ? 'hr' : 'admin';
        const name = isEmployee ? 'Employee One' : isHR ? 'HR One' : 'Admin User';
        const token = 'dev-token';
        const employeeId = isEmployee ? '31' : undefined; // Use real ID 31 for demo employee
        authLogin(token, role, name, employeeId);
        localStorage.setItem('username', u);

        // Redirect employees to attendance, others to dashboard
        const redirectPath = isEmployee ? '/attendance' : '/dashboard';
        navigate(redirectPath);
        return;
      }

      setError(errorMessage || 'Invalid username or password');
    } catch (error: any) {
      console.error('Login error:', error);
      // More specific error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        setError(`Cannot connect to backend server. Please ensure the server is running on ${API_BASE_URL}`);
      } else if (error.message?.includes('CORS')) {
        setError('CORS error: Backend server may not be configured to accept requests from this origin.');
      } else {
        setError(`Login failed: ${error.message || 'Please check your connection and try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockIcon />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            HRMS Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Remember me"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Demo Credentials:
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Employee:</strong> employee1 / emp123
            </Typography>
            <Typography variant="body2">
              <strong>HR:</strong> hr1 / hr123
            </Typography>
            <Typography variant="body2">
              <strong>Admin:</strong> admin / admin123
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
