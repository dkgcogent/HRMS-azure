import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, Assignment, CheckCircle, HourglassEmpty } from '@mui/icons-material';

interface DashboardStatCardProps {
  title: string;
  value: number;
  type: 'pending' | 'inProgress' | 'completed' | 'total';
  icon?: React.ReactNode;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  type,
  icon,
}) => {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'pending':
        return <HourglassEmpty sx={{ fontSize: 40 }} />;
      case 'inProgress':
        return <TrendingUp sx={{ fontSize: 40 }} />;
      case 'completed':
        return <CheckCircle sx={{ fontSize: 40 }} />;
      case 'total':
        return <Assignment sx={{ fontSize: 40 }} />;
      default:
        return <Assignment sx={{ fontSize: 40 }} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'pending':
        return '#ff9800';
      case 'inProgress':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      case 'total':
        return '#757575';
      default:
        return '#757575';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${getColor()}15 0%, ${getColor()}05 100%)`,
        border: `1px solid ${getColor()}30`,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: getColor() }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: getColor() }}>
            {getIcon()}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

