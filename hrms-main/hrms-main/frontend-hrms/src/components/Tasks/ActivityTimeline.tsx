import React from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Create as CreateIcon,
  Update as UpdateIcon,
  Comment as CommentIcon,
  AttachFile as FileIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export interface ActivityLog {
  id: number;
  activity_type: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  attachment_path?: string;
  timestamp: string;
  user_name?: string;
  user_email?: string;
}

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return <CreateIcon />;
      case 'TASK_UPDATED':
        return <UpdateIcon />;
      case 'STATUS_CHANGED':
        return <CheckIcon />;
      case 'TASK_REASSIGNED':
        return <PersonIcon />;
      case 'COMMENT_ADDED':
        return <CommentIcon />;
      case 'FILE_UPLOADED':
        return <FileIcon />;
      case 'TASK_CLOSED':
        return <CloseIcon />;
      default:
        return <UpdateIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return 'primary';
      case 'TASK_UPDATED':
        return 'info';
      case 'STATUS_CHANGED':
        return 'success';
      case 'TASK_REASSIGNED':
        return 'warning';
      case 'COMMENT_ADDED':
        return 'secondary';
      case 'FILE_UPLOADED':
        return 'info';
      case 'TASK_CLOSED':
        return 'error';
      default:
        return 'grey';
    }
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const userName = activity.user_name || activity.user_email || 'Unknown User';

    switch (activity.activity_type) {
      case 'TASK_CREATED':
        return `${userName} created this task`;
      case 'TASK_UPDATED':
        return `${userName} updated the task`;
      case 'STATUS_CHANGED':
        return `${userName} changed status from ${activity.old_value} to ${activity.new_value}`;
      case 'TASK_REASSIGNED':
        return `${userName} reassigned the task`;
      case 'COMMENT_ADDED':
        return `${userName} added a comment`;
      case 'FILE_UPLOADED':
        return `${userName} uploaded a file: ${activity.new_value}`;
      case 'TASK_CLOSED':
        return `${userName} closed the task`;
      default:
        return `${userName} performed ${activity.activity_type}`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (activities.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Activity Log
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No activity recorded yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Activity Log ({activities.length})
      </Typography>
      <Timeline>
        {activities.map((activity, index) => (
          <TimelineItem key={activity.id}>
            <TimelineSeparator>
              <TimelineDot color={getActivityColor(activity.activity_type) as any}>
                {getActivityIcon(activity.activity_type)}
              </TimelineDot>
              {index < activities.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {getActivityDescription(activity)}
                </Typography>
                {activity.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    "{activity.comment}"
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {formatTimestamp(activity.timestamp)}
                </Typography>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
};

