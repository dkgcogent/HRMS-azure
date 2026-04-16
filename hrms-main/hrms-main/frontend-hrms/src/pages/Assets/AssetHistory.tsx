// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Assignment as AssignIcon,
  SwapHoriz as TransferIcon,
  Build as MaintenanceIcon,
  Delete as DeleteIcon,
  CheckCircle as ReturnIcon,
  ChangeCircle as StatusIcon,
} from '@mui/icons-material';

interface HistoryEntry {
  id: number;
  actionType: string;
  actionBy?: number;
  actionByUser?: string;
  actionDate: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  remarks?: string;
}

interface AssetHistoryProps {
  assetId: number;
}

const AssetHistory: React.FC<AssetHistoryProps> = ({ assetId }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [assetId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/assets/${assetId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setHistory(result.data || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATED':
        return <AddIcon />;
      case 'UPDATED':
        return <EditIcon />;
      case 'ASSIGNED':
        return <AssignIcon />;
      case 'RETURNED':
        return <ReturnIcon />;
      case 'TRANSFERRED':
        return <TransferIcon />;
      case 'MAINTENANCE':
        return <MaintenanceIcon />;
      case 'CONDITION_CHANGED':
      case 'STATUS_CHANGED':
        return <StatusIcon />;
      case 'DELETED':
        return <DeleteIcon />;
      default:
        return <EditIcon />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATED':
        return 'success';
      case 'UPDATED':
        return 'primary';
      case 'ASSIGNED':
        return 'info';
      case 'RETURNED':
        return 'success';
      case 'TRANSFERRED':
        return 'warning';
      case 'MAINTENANCE':
        return 'warning';
      case 'CONDITION_CHANGED':
      case 'STATUS_CHANGED':
        return 'secondary';
      case 'DELETED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderChanges = (oldValue: any, newValue: any) => {
    if (!oldValue && !newValue) return null;

    if (typeof newValue === 'object' && newValue !== null) {
      return (
        <Box sx={{ mt: 1 }}>
          {Object.entries(newValue).map(([key, value]: [string, any]) => {
            const oldVal = oldValue?.[key];
            if (value?.old !== undefined && value?.new !== undefined) {
              return (
                <Box key={key} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {key.replace('_', ' ').toUpperCase()}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={String(value.old || 'N/A')}
                      size="small"
                      variant="outlined"
                      color="default"
                    />
                    <Typography variant="caption">→</Typography>
                    <Chip
                      label={String(value.new || 'N/A')}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </Box>
              );
            }
            return null;
          })}
        </Box>
      );
    }

    return null;
  };

  if (loading) {
    return <Box>Loading history...</Box>;
  }

  if (history.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No history available for this asset
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Asset Lifecycle History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete audit trail of all changes and activities
      </Typography>

      <Timeline>
        {history.map((entry, index) => (
          <TimelineItem key={entry.id}>
            <TimelineSeparator>
              <TimelineDot color={getActionColor(entry.actionType)}>
                {getActionIcon(entry.actionType)}
              </TimelineDot>
              {index < history.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatActionType(entry.actionType)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.actionDate).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={formatActionType(entry.actionType)}
                      size="small"
                      color={getActionColor(entry.actionType)}
                    />
                  </Box>

                  {entry.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {entry.description}
                    </Typography>
                  )}

                  {entry.actionByUser && (
                    <Typography variant="caption" color="text.secondary">
                      By: {entry.actionByUser}
                    </Typography>
                  )}

                  {entry.oldValue && entry.newValue && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        Changes:
                      </Typography>
                      {renderChanges(entry.oldValue, entry.newValue)}
                    </>
                  )}

                  {entry.remarks && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Remarks:</strong> {entry.remarks}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Paper>
  );
};

export default AssetHistory;

