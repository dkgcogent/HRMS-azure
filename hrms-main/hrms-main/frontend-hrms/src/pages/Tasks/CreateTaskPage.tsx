import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { CreateTaskForm } from '../../components/Tasks/CreateTaskForm';

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTaskUsers();
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (taskData: {
    title: string;
    description?: string;
    assignedTo: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: string;
  }) => {
    try {
      const response = await apiService.createTask(taskData);
      if (response.success) {
        navigate(`/tasks/${response.data.id}`);
      } else {
        alert(response.message || 'Failed to create task');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <CreateTaskForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        users={users}
        mode="create"
      />
    </Container>
  );
};

