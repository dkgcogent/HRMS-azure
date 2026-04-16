// @ts-nocheck
import React from 'react';
import { Skeleton, Box } from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  count?: number;
  animation?: 'pulse' | 'wave' | false;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 20,
  count = 1,
  animation = 'wave',
}) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={{ mb: count > 1 && index < count - 1 ? 1 : 0 }}
        />
      ))}
    </Box>
  );
};

export default LoadingSkeleton;










