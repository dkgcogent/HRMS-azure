// Global styles for all Select components to ensure placeholder visibility
import { Theme } from '@mui/material/styles';

export const globalSelectStyles = {
  '& .MuiSelect-select': {
    paddingLeft: '20px !important', // Increased padding to prevent placeholder from being hidden
    paddingRight: '40px !important', // Space for dropdown arrow
    paddingTop: '14px !important',
    paddingBottom: '14px !important',
    minHeight: '1.4375em !important',
    overflow: 'visible !important',
    textOverflow: 'clip !important',
    whiteSpace: 'nowrap !important',
    '@media (max-width:600px)': {
      paddingLeft: '16px !important',
      paddingRight: '32px !important',
      paddingTop: '10px !important',
      paddingBottom: '10px !important',
    },
  },
  // When Select has startAdornment (icon), add extra padding
  '& .MuiInputAdornment-root + .MuiSelect-select, & .MuiInputAdornment-positionStart + .MuiSelect-select': {
    paddingLeft: '42px !important',
    '@media (max-width:600px)': {
      paddingLeft: '36px !important',
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
  // Prevent input from truncating
  '& .MuiOutlinedInput-input': {
    overflow: 'visible !important',
    textOverflow: 'clip !important',
  },
};

