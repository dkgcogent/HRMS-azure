// @ts-nocheck
import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled TextField with consistent placeholder styling
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input::placeholder': {
    color: theme.palette.text.secondary,
    opacity: 0.6,
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
  },
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

// Styled Select with consistent styling
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
  },
}));

export interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'datetime-local' | 'password' | 'url';
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  inputProps?: any;
  select?: boolean;
  options?: Array<{ value: any; label: string }>;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  autoFocus?: boolean;
  autoComplete?: string;
  sx?: any;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
}

/**
 * Reusable FormField component with consistent placeholders and styling
 * 
 * @example
 * <FormField
 *   name="firstName"
 *   label="First Name"
 *   placeholder="Enter your first name"
 *   value={formData.firstName}
 *   onChange={handleChange}
 *   required
 * />
 */
const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows,
  maxRows,
  min,
  max,
  step,
  inputProps,
  select = false,
  options = [],
  startAdornment,
  endAdornment,
  autoFocus = false,
  autoComplete,
  sx,
  size = 'medium',
  variant = 'outlined',
}) => {
  // Generate placeholder if not provided
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    // Auto-generate placeholder based on label and type
    const labelLower = label.toLowerCase();
    
    if (type === 'email') return 'Enter your email address';
    if (type === 'tel') return 'Enter phone number';
    if (type === 'number') return `Enter ${labelLower}`;
    if (type === 'date') return 'Select date';
    if (type === 'time') return 'Select time';
    if (type === 'password') return 'Enter password';
    if (multiline) return `Write ${labelLower} here`;
    
    return `Enter ${labelLower}`;
  };

  // Handle select change
  const handleSelectChange = (e: any) => {
    onChange({
      target: {
        name,
        value: e.target.value,
      },
    });
  };

  // Select field
  if (select) {
    return (
      <StyledFormControl
        fullWidth={fullWidth}
        required={required}
        error={error}
        disabled={disabled}
        size={size}
        variant={variant}
        sx={sx}
      >
        <InputLabel id={`${name}-label`} shrink>
          {label}
        </InputLabel>
        <Select
          labelId={`${name}-label`}
          id={name}
          name={name}
          value={value || ''}
          onChange={handleSelectChange}
          label={label}
          disabled={disabled || !options || options.length === 0}
          startAdornment={startAdornment}
          endAdornment={endAdornment}
          displayEmpty
          renderValue={(selected) => {
            if (!selected || selected === '') {
              return (
                <span style={{ 
                  color: 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.875rem',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  whiteSpace: 'nowrap',
                }}>
                  {placeholder || `Select ${label}`}
                </span>
              );
            }
            const selectedOption = options.find((opt) => opt.value === selected);
            return selectedOption?.label || String(selected);
          }}
          sx={{
            '& .MuiSelect-select': {
              paddingLeft: startAdornment ? '42px !important' : '20px !important', // Extra padding when icon is present
              paddingRight: endAdornment ? '42px !important' : '40px !important', // Space for dropdown arrow or end icon
              paddingTop: '14px !important',
              paddingBottom: '14px !important',
              overflow: 'visible !important',
              textOverflow: 'clip !important',
              whiteSpace: 'nowrap !important',
              '@media (max-width:600px)': {
                paddingLeft: startAdornment ? '36px !important' : '16px !important',
                paddingRight: endAdornment ? '36px !important' : '32px !important',
                paddingTop: '10px !important',
                paddingBottom: '10px !important',
              },
            },
            // Ensure placeholder text is fully visible
            '& .MuiSelect-select > span, & .MuiSelect-select > .MuiTypography-root, & .MuiSelect-select > .MuiBox-root': {
              overflow: 'visible !important',
              textOverflow: 'clip !important',
              whiteSpace: 'nowrap !important',
              maxWidth: 'none !important',
              width: 'auto !important',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 300,
              },
            },
          }}
        >
          {options && options.length > 0 ? (
            options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))
          ) : (
            <MenuItem value="" disabled>
              <em>No options available</em>
            </MenuItem>
          )}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </StyledFormControl>
    );
  }

  // Text field (text, email, number, date, etc.)
  return (
    <StyledTextField
      id={name}
      name={name}
      label={label}
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={getPlaceholder()}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      min={min}
      max={max}
      step={step}
      InputProps={{
        startAdornment,
        endAdornment,
        ...inputProps,
      }}
      InputLabelProps={{
        shrink: type === 'date' || type === 'time' || type === 'datetime-local' ? true : undefined,
      }}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      size={size}
      variant={variant}
      sx={sx}
      aria-label={label}
      aria-required={required}
      aria-invalid={error}
      aria-describedby={helperText ? `${name}-helper-text` : undefined}
    />
  );
};

export default FormField;


