import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface FileUploadProps {
  onFileUploaded?: (fileInfo: any) => void;
  onFileDeleted?: (fileName: string) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  uploadType?: 'photo' | 'document';
  existingFile?: any;
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onFileDeleted,
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  maxSize = 10,
  uploadType = 'document',
  existingFile,
  label = 'Upload File'
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<any>(existingFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    try {
      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        const fileInfo = response.data.data;
        setUploadedFile(fileInfo);
        if (onFileUploaded) {
          onFileUploaded(fileInfo);
        }
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!uploadedFile) return;

    try {
      await axios.delete(`/api/files/${uploadedFile.fileName}`);
      setUploadedFile(null);
      if (onFileDeleted) {
        onFileDeleted(uploadedFile.fileName);
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleView = () => {
    if (uploadedFile) {
      window.open(`/api/files/view/${uploadedFile.fileName}`, '_blank');
    }
  };

  const handleDownload = () => {
    if (uploadedFile) {
      window.open(`/api/files/download/${uploadedFile.fileName}`, '_blank');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {!uploadedFile ? (
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            fullWidth
            sx={{ 
              py: 2,
              borderStyle: 'dashed',
              borderWidth: 2,
              '&:hover': {
                borderStyle: 'dashed',
                borderWidth: 2,
              }
            }}
          >
            {uploading ? 'Uploading...' : label}
          </Button>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                {uploadProgress}% uploaded
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" component="span">
                {getFileIcon(uploadedFile.fileName)}
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {uploadedFile.originalName || uploadedFile.fileName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip 
                    label={formatFileSize(parseInt(uploadedFile.size || '0'))} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={uploadedFile.contentType} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
          <CardActions sx={{ pt: 0 }}>
            <IconButton size="small" onClick={handleView} title="View">
              <VisibilityIcon />
            </IconButton>
            <IconButton size="small" onClick={handleDownload} title="Download">
              <DownloadIcon />
            </IconButton>
            <IconButton size="small" onClick={handleDelete} color="error" title="Delete">
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Accepted formats: {acceptedTypes.replace(/\*/g, 'all')} • Max size: {maxSize}MB
      </Typography>
    </Box>
  );
};

export default FileUpload;
