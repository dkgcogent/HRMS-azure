// @ts-nocheck
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectProps,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled FormControl with responsive design
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: '100%',
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8125rem',
    },
  },
  '& .MuiOutlinedInput-root': {
    fontSize: '0.9375rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
    },
    // Prevent text truncation in the input
    overflow: 'visible !important',
    '& .MuiSelect-select': {
      overflow: 'visible !important',
      textOverflow: 'clip !important',
      width: '100% !important',
    },
    // Ensure input doesn't clip content
    '& input': {
      overflow: 'visible !important',
      textOverflow: 'clip !important',
    },
  },
  '& .MuiSelect-select': {
    paddingTop: `${theme.spacing(1.5)} !important`,
    paddingBottom: `${theme.spacing(1.5)} !important`,
    paddingLeft: `${theme.spacing(2.5)} !important`, // Increased left padding for placeholder visibility
    paddingRight: `${theme.spacing(4)} !important`, // Space for dropdown arrow icon
    minHeight: '1.4375em !important', // Ensure minimum height for text visibility
    display: 'flex !important',
    alignItems: 'center !important',
    overflow: 'visible !important',
    textOverflow: 'clip !important',
    whiteSpace: 'nowrap !important',
    [theme.breakpoints.down('sm')]: {
      paddingTop: `${theme.spacing(1.25)} !important`,
      paddingBottom: `${theme.spacing(1.25)} !important`,
      paddingLeft: `${theme.spacing(2)} !important`,
      paddingRight: `${theme.spacing(3)} !important`,
    },
  },
  // Ensure placeholder text is not truncated
  '& .MuiSelect-select span, & .MuiSelect-select .MuiTypography-root, & .MuiSelect-select .MuiBox-root': {
    overflow: 'visible !important',
    textOverflow: 'clip !important',
    whiteSpace: 'nowrap',
    wordBreak: 'normal',
    maxWidth: 'none',
    width: 'auto',
    flex: '0 1 auto',
  },
  // When Select has startAdornment (icon), add extra padding
  '& .MuiInputAdornment-root + .MuiSelect-select, & .MuiInputAdornment-positionStart + .MuiSelect-select': {
    paddingLeft: `${theme.spacing(4.5)} !important`, // Extra padding when icon is present (42px)
    [theme.breakpoints.down('sm')]: {
      paddingLeft: `${theme.spacing(3.5)} !important`, // 28px on mobile
    },
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
    [theme.breakpoints.down('sm')]: {
      transform: 'translate(12px, -9px) scale(0.75)',
    },
  },
}));

// Styled MenuItem for better mobile experience
const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  fontSize: '0.9375rem',
  padding: theme.spacing(1.25, 2),
  minHeight: '48px', // Better touch target for mobile
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.875rem',
    padding: theme.spacing(1, 1.5),
    minHeight: '44px',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
    },
  },
}));

export interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ResponsiveDropdownProps extends Omit<SelectProps, 'children'> {
  /**
   * Label for the dropdown
   */
  label: string;
  
  /**
   * Array of options to display
   */
  options: DropdownOption[];
  
  /**
   * Current selected value
   */
  value: string | number | '';
  
  /**
   * Change handler function
   */
  onChange: (event: any) => void;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  
  /**
   * Error state
   */
  error?: boolean;
  
  /**
   * Helper text to display below the dropdown
   */
  helperText?: string;
  
  /**
   * Full width of container
   */
  fullWidth?: boolean;
  
  /**
   * Size of the dropdown
   */
  size?: 'small' | 'medium';
  
  /**
   * Variant of the input
   */
  variant?: 'outlined' | 'filled' | 'standard';
  
  /**
   * Placeholder text when no value is selected
   */
  placeholder?: string;
  
  /**
   * Show "None" or "All" option at the top
   */
  showNoneOption?: boolean;
  
  /**
   * Text for the none option (default: "None")
   */
  noneOptionText?: string;
  
  /**
   * Custom styles
   */
  sx?: any;
  
  /**
   * Minimum width (useful for filters)
   */
  minWidth?: number | string;
  
  /**
   * Maximum height for the dropdown menu
   */
  maxMenuHeight?: number;
  
  /**
   * Whether to display options in a grid layout (for better mobile experience)
   */
  displayEmpty?: boolean;
}

/**
 * ResponsiveDropdown - A reusable, responsive dropdown component
 * 
 * @example
 * ```tsx
 * <ResponsiveDropdown
 *   label="Status"
 *   value={status}
 *   onChange={(e) => setStatus(e.target.value)}
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' }
 *   ]}
 *   required
 *   fullWidth
 * />
 * ```
 */
const ResponsiveDropdown: React.FC<ResponsiveDropdownProps> = ({
  label,
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  placeholder,
  showNoneOption = false,
  noneOptionText = 'None',
  sx,
  minWidth,
  maxMenuHeight = 300,
  displayEmpty = true,
  ...otherProps
}) => {
  const labelId = `dropdown-label-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const selectId = `dropdown-select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <StyledFormControl
      fullWidth={fullWidth}
      required={required}
      error={error}
      disabled={disabled}
      size={size}
      variant={variant}
      sx={{
        ...(minWidth && { minWidth }),
        ...sx,
      }}
    >
      <InputLabel id={labelId} shrink={!!value || displayEmpty}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={selectId}
        value={value ?? ''}
        label={label}
        onChange={onChange}
        displayEmpty={displayEmpty}
        disabled={disabled || !options || options.length === 0}
        sx={{
          '& .MuiSelect-select': {
            paddingLeft: otherProps.startAdornment ? '42px !important' : '20px !important', // Extra padding when icon is present
            paddingRight: '40px !important', // Space for dropdown arrow
            paddingTop: '14px !important',
            paddingBottom: '14px !important',
            minHeight: '1.4375em !important', // Ensure minimum height
            display: 'flex !important',
            alignItems: 'center !important',
            overflow: 'visible !important',
            textOverflow: 'clip !important',
            whiteSpace: 'nowrap !important',
            width: '100% !important', // Ensure full width
            boxSizing: 'border-box !important',
            '@media (max-width:600px)': {
              paddingLeft: otherProps.startAdornment ? '36px !important' : '16px !important',
              paddingRight: '32px !important',
              paddingTop: '10px !important',
              paddingBottom: '10px !important',
            },
          },
          // Ensure placeholder and selected text are fully visible and not truncated
          '& .MuiSelect-select > span, & .MuiSelect-select > .MuiTypography-root, & .MuiSelect-select > .MuiBox-root': {
            overflow: 'visible !important',
            textOverflow: 'clip !important',
            whiteSpace: 'nowrap !important',
            wordBreak: 'normal !important',
            maxWidth: 'none !important',
            width: 'auto !important',
            flex: '0 1 auto !important',
            lineHeight: '1.4375em !important',
            display: 'inline-block !important',
            minWidth: 'fit-content !important',
          },
          // Prevent any parent from truncating
          '& .MuiOutlinedInput-input': {
            overflow: 'visible !important',
            textOverflow: 'clip !important',
          },
          // Ensure the input root doesn't truncate
          '& .MuiOutlinedInput-root': {
            overflow: 'visible !important',
            '& .MuiOutlinedInput-notchedOutline': {
              // Keep outline visible
            },
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: maxMenuHeight,
              '& .MuiMenuItem-root': {
                fontSize: {
                  xs: '0.875rem',
                  sm: '0.9375rem',
                },
              },
            },
          },
          // Better mobile experience
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          // Auto-adjust position on mobile
          getContentAnchorEl: null,
        }}
        renderValue={(selected) => {
          // Handle empty options case
          if (!options || options.length === 0) {
            return (
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: {
                    xs: '0.875rem',
                    sm: '0.9375rem',
                  },
                  display: 'inline-block !important',
                  overflow: 'visible !important',
                  textOverflow: 'clip !important',
                  whiteSpace: 'nowrap !important',
                  maxWidth: 'none !important',
                  width: 'auto !important',
                  minWidth: 'auto !important',
                  opacity: 0.6,
                  lineHeight: '1.4375em',
                  paddingLeft: '0px !important',
                  paddingRight: '0px !important',
                  marginLeft: '0px !important',
                  marginRight: '0px !important',
                }}
              >
                {placeholder || `No ${label.toLowerCase()} available`}
              </Box>
            );
          }
          // Handle no selection case
          if (!selected || selected === '') {
            return (
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: {
                    xs: '0.875rem',
                    sm: '0.9375rem',
                  },
                  display: 'inline-block !important',
                  overflow: 'visible !important',
                  textOverflow: 'clip !important',
                  whiteSpace: 'nowrap !important',
                  maxWidth: 'none !important',
                  width: 'auto !important',
                  minWidth: 'auto !important',
                  opacity: 0.7,
                  lineHeight: '1.4375em',
                  paddingLeft: '0px !important',
                  paddingRight: '0px !important',
                  marginLeft: '0px !important',
                  marginRight: '0px !important',
                }}
              >
                {placeholder || `Select ${label}`}
              </Box>
            );
          }
          // Handle selected value
          const selectedOption = options.find((opt) => opt.value === selected);
          if (!selectedOption) {
            return (
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: {
                    xs: '0.875rem',
                    sm: '0.9375rem',
                  },
                  display: 'inline-block !important',
                  overflow: 'visible !important',
                  textOverflow: 'clip !important',
                  whiteSpace: 'nowrap !important',
                  maxWidth: 'none !important',
                  width: 'auto !important',
                  opacity: 0.7,
                }}
              >
                {placeholder || `Select ${label}`}
              </Box>
            );
          }
          // Return selected value - ensure it's not truncated
          return (
            <Box
              component="span"
              sx={{
                color: 'text.primary',
                fontSize: {
                  xs: '0.875rem',
                  sm: '0.9375rem',
                },
                display: 'inline-block !important',
                overflow: 'visible !important',
                textOverflow: 'clip !important',
                whiteSpace: 'nowrap !important',
                maxWidth: 'none !important',
                width: 'auto !important',
                lineHeight: '1.4375em',
              }}
            >
              {selectedOption.label || String(selected)}
            </Box>
          );
        }}
        {...otherProps}
      >
        {showNoneOption && (
          <StyledMenuItem value="">
            <em>{noneOptionText}</em>
          </StyledMenuItem>
        )}
        {options && options.length > 0 ? (
          options.map((option) => (
            <StyledMenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </StyledMenuItem>
          ))
        ) : (
          <StyledMenuItem value="" disabled>
            <em>No options available</em>
          </StyledMenuItem>
        )}
      </Select>
      {helperText && (
        <FormHelperText
          sx={{
            fontSize: {
              xs: '0.75rem',
              sm: '0.8125rem',
            },
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </StyledFormControl>
  );
};

export default ResponsiveDropdown;

