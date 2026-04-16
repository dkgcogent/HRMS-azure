// @ts-nocheck
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface ModernCardProps {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  gradient?: boolean;
  elevation?: number;
  sx?: any;
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  children,
  action,
  gradient = false,
  elevation = 2,
  sx = {},
}) => {
  return (
    <Card
      elevation={elevation}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        background: gradient
          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
          : 'white',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-2px)',
        },
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          )}
          {action && <Box>{action}</Box>}
        </Box>
      )}
      <CardContent sx={{ p: title || action ? 2 : 3 }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ModernCard;










