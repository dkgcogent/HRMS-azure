import { createTheme } from '@mui/material/styles';

// Modern color palette
const colors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  secondary: {
    50: '#FCE4EC',
    100: '#F8BBD0',
    200: '#F48FB1',
    300: '#F06292',
    400: '#EC407A',
    500: '#E91E63',
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
    900: '#880E4F',
  },
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Create modern enterprise theme
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[800],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.success[500],
      light: colors.success[300],
      dark: colors.success[700],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700],
    },
    error: {
      main: colors.error[500],
      light: colors.error[300],
      dark: colors.error[700],
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A202C',
      secondary: '#718096',
    },
    grey: colors.grey,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
    '0px 2px 6px rgba(0, 0, 0, 0.05), 0px 2px 4px rgba(0, 0, 0, 0.08)',
    '0px 4px 12px rgba(0, 0, 0, 0.05), 0px 2px 6px rgba(0, 0, 0, 0.08)',
    '0px 6px 16px rgba(0, 0, 0, 0.06), 0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 24px rgba(0, 0, 0, 0.06), 0px 6px 12px rgba(0, 0, 0, 0.1)',
    '0px 12px 32px rgba(0, 0, 0, 0.08), 0px 8px 16px rgba(0, 0, 0, 0.1)',
    '0px 16px 40px rgba(0, 0, 0, 0.08), 0px 12px 24px rgba(0, 0, 0, 0.12)',
    '0px 20px 48px rgba(0, 0, 0, 0.1), 0px 16px 32px rgba(0, 0, 0, 0.12)',
    '0px 24px 56px rgba(0, 0, 0, 0.12), 0px 20px 40px rgba(0, 0, 0, 0.14)',
    '0px 28px 64px rgba(0, 0, 0, 0.14), 0px 24px 48px rgba(0, 0, 0, 0.16)',
    '0px 32px 72px rgba(0, 0, 0, 0.16), 0px 28px 56px rgba(0, 0, 0, 0.18)',
    '0px 36px 80px rgba(0, 0, 0, 0.18), 0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 40px 88px rgba(0, 0, 0, 0.2), 0px 36px 72px rgba(0, 0, 0, 0.22)',
    '0px 44px 96px rgba(0, 0, 0, 0.22), 0px 40px 80px rgba(0, 0, 0, 0.24)',
    '0px 48px 104px rgba(0, 0, 0, 0.24), 0px 44px 88px rgba(0, 0, 0, 0.26)',
    '0px 52px 112px rgba(0, 0, 0, 0.26), 0px 48px 96px rgba(0, 0, 0, 0.28)',
    '0px 56px 120px rgba(0, 0, 0, 0.28), 0px 52px 104px rgba(0, 0, 0, 0.3)',
    '0px 60px 128px rgba(0, 0, 0, 0.3), 0px 56px 112px rgba(0, 0, 0, 0.32)',
    '0px 64px 136px rgba(0, 0, 0, 0.32), 0px 60px 120px rgba(0, 0, 0, 0.34)',
    '0px 68px 144px rgba(0, 0, 0, 0.34), 0px 64px 128px rgba(0, 0, 0, 0.36)',
    '0px 72px 152px rgba(0, 0, 0, 0.36), 0px 68px 136px rgba(0, 0, 0, 0.38)',
    '0px 76px 160px rgba(0, 0, 0, 0.38), 0px 72px 144px rgba(0, 0, 0, 0.4)',
    '0px 80px 168px rgba(0, 0, 0, 0.4), 0px 76px 152px rgba(0, 0, 0, 0.42)',
    '0px 84px 176px rgba(0, 0, 0, 0.42), 0px 80px 160px rgba(0, 0, 0, 0.44)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 4px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12), 0px 4px 8px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 4px rgba(0, 0, 0, 0.04)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 4px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary[400],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          height: 28,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F8F9FA',
          color: '#1A202C',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          paddingLeft: '20px !important',
          paddingRight: '40px !important',
          paddingTop: '14px !important',
          paddingBottom: '14px !important',
          minHeight: '1.4375em !important',
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
          // Ensure all child elements (spans, Box, Typography) don't truncate
          '& > span, & > .MuiTypography-root, & > .MuiBox-root': {
            overflow: 'visible !important',
            textOverflow: 'clip !important',
            whiteSpace: 'nowrap !important',
            maxWidth: 'none !important',
            width: 'auto !important',
            display: 'inline-block !important',
          },
        } as any,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiSelect-select': {
            overflow: 'visible !important',
            textOverflow: 'clip !important',
            width: '100% !important',
          },
          // When Select has startAdornment (icon), add extra padding
          '& .MuiInputAdornment-root + .MuiSelect-select, & .MuiInputAdornment-positionStart + .MuiSelect-select': {
            paddingLeft: '42px !important',
            '@media (max-width:600px)': {
              paddingLeft: '36px !important',
            },
          },
        } as any,
        input: {
          overflow: 'visible !important',
          textOverflow: 'clip !important',
        } as any,
      },
    },
  },
});

// Export color palette for use in components
export const themeColors = colors;

