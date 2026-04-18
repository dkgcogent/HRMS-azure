// @ts-nocheck
import React, { useRef, useState } from 'react';
import { API_BASE_URL, getPublicUrl } from '../../services/api';
import {
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as FileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export interface TaskFile {
  id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  uploaded_at?: string;
  user_name?: string;
}

interface FileUploadButtonProps {
  files: TaskFile[];
  onUpload: (file: File) => Promise<void>;
  onDelete?: (fileId: number) => Promise<void>;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  files,
  onUpload,
  onDelete,
  maxSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      alert(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
      return;
    }

    // Validate file type if specified
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      alert(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(file);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (file: TaskFile) => {
    const url = getPublicUrl(file.file_path);
    window.open(url, '_blank');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Files ({files.length})
      </Typography>

      <Box mb={2}>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          fullWidth
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
        {uploading && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}
      </Box>

      {files.length > 0 && (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <FileIcon sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText
                primary={file.file_name}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {formatFileSize(file.file_size)}
                    </Typography>
                    {file.uploaded_at && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(file.uploaded_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Box>
                <IconButton
                  size="small"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <FileIcon />
                </IconButton>
                {onDelete && (
                  <IconButton
                    size="small"
                    onClick={() => onDelete(file.id)}
                    color="error"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      {files.length === 0 && !uploading && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No files uploaded yet.
        </Typography>
      )}
    </Box>
  );
};

