// @ts-nocheck
import React from 'react';
import { Box, Paper, Typography, Divider, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

export interface FormSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  spacing?: number;
  elevation?: number;
  sx?: any;
}

/**
 * FormSection component for grouping related form fields
 * 
 * @example
 * <FormSection title="Personal Information" subtitle="Enter your personal details">
 *   <FormField name="firstName" label="First Name" ... />
 *   <FormField name="lastName" label="Last Name" ... />
 * </FormSection>
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
  columns = 2,
  spacing = 3,
  elevation = 2,
  sx,
}) => {
  return (
    <StyledPaper elevation={elevation} sx={sx}>
      {title && (
        <Box sx={{ mb: 2 }}>
          <SectionTitle variant="h6">{title}</SectionTitle>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          <Divider sx={{ mt: 2 }} />
        </Box>
      )}
      <Grid container spacing={spacing}>
        {React.Children.map(children, (child, index) => (
          <Grid
            item
            xs={12}
            sm={columns === 1 ? 12 : columns === 2 ? 6 : columns === 3 ? 4 : 3}
            key={index}
          >
            {child}
          </Grid>
        ))}
      </Grid>
    </StyledPaper>
  );
};

export default FormSection;











