// @ts-nocheck
import React from 'react';
import { Box, Button, Paper, Stack, Alert, Snackbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';

const StyledContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

export interface FormContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string;
  success?: string;
  showActions?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * FormContainer component - Main wrapper for forms
 * 
 * @example
 * <FormContainer
 *   title="Employee Registration"
 *   subtitle="Fill in all required fields"
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * >
 *   <FormSection>...</FormSection>
 * </FormContainer>
 */
const FormContainer: React.FC<FormContainerProps> = ({
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  error,
  success,
  showActions = true,
  maxWidth = 'lg',
}) => {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  React.useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  React.useEffect(() => {
    if (success) {
      setSnackbar({ open: true, message: success, severity: 'success' });
    }
  }, [success]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <StyledContainer>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      <form onSubmit={onSubmit} noValidate>
        <FormPaper elevation={2}>
          {children}
        </FormPaper>

        {showActions && (
          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            sx={{ mt: 3 }}
          >
            {onCancel && (
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={loading}
                size="large"
              >
                {cancelLabel}
              </Button>
            )}
            {onSubmit && (
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
                size="large"
              >
                {loading ? 'Saving...' : submitLabel}
              </Button>
            )}
          </Stack>
        )}
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </StyledContainer>
  );
};

export default FormContainer;

