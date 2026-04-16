import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon } from '@mui/icons-material';

export interface Comment {
  id: number;
  comment: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
}

interface CommentBoxProps {
  comments: Comment[];
  onAddComment: (comment: string) => Promise<void>;
  currentUserName?: string;
  currentUserEmail?: string;
}

export const CommentBox: React.FC<CommentBoxProps> = ({
  comments,
  onAddComment,
  currentUserName,
  currentUserEmail,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments ({comments.length})
      </Typography>

      {/* Add Comment Form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </Box>
      </Paper>

      {/* Comments List */}
      <Box>
        {comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No comments yet. Be the first to comment!
          </Typography>
        ) : (
          comments.map((comment, index) => (
            <Box key={comment.id}>
              <Box display="flex" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getInitials(comment.user_name, comment.user_email)}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {comment.user_name || comment.user_email || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {comment.comment}
                  </Typography>
                </Box>
              </Box>
              {index < comments.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

