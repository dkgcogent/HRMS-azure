import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Delete,
  Download,
  CheckCircle,
  Schedule,
  Error,
  Visibility,
} from '@mui/icons-material';

import { apiService, DocumentType } from '../../services/api';

interface EmployeeDocument {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  documentNumber: string;
  fileName: string;
  filePath: string;
  fileExtension: string;
  fileSizeBytes: number;
  isVerified: boolean;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  uploadedAt: string;
}

interface UploadState {
  file: File | null;
  documentTypeId: number;
  documentNumber: string;
  uploading: boolean;
  progress: number;
}

const DocumentUploadForm: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    documentTypeId: 0,
    documentNumber: '',
    uploading: false,
    progress: 0,
  });

  const sampleEmployeeDocuments: EmployeeDocument[] = [
    {
      id: 1,
      documentTypeId: 1,
      documentTypeName: 'Aadhar Card',
      documentNumber: '1234-5678-9012',
      fileName: 'aadhar_john_doe.pdf',
      filePath: '/uploads/documents/aadhar_john_doe.pdf',
      fileExtension: 'pdf',
      fileSizeBytes: 1024000,
      isVerified: true,
      verifiedAt: '2024-03-01',
      verifiedBy: 'HR Manager',
      uploadedAt: '2024-02-15',
    },
    {
      id: 2,
      documentTypeId: 2,
      documentTypeName: 'PAN Card',
      documentNumber: 'ABCDE1234F',
      fileName: 'pan_john_doe.pdf',
      filePath: '/uploads/documents/pan_john_doe.pdf',
      fileExtension: 'pdf',
      fileSizeBytes: 512000,
      isVerified: false,
      uploadedAt: '2024-02-20',
    },
  ];

  useEffect(() => {
    fetchDocumentTypes();
    fetchEmployeeDocuments();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const response = await apiService.getDocumentTypes();
      setDocumentTypes(response.data || []);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to fetch document types',
      });
    }
  };

  const fetchEmployeeDocuments = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      setEmployeeDocuments(sampleEmployeeDocuments);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to fetch employee documents',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadState(prev => ({ ...prev, file }));
    }
  };

  const validateFile = (file: File, documentType: DocumentType): string | null => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = documentType.allowedExtensions?.split(',') || [];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return `Invalid file type. Allowed: ${documentType.allowedExtensions}`;
    }

    if (file.size > (documentType.maxFileSizeMb || 0) * 1024 * 1024) {
      return `File size too large. Maximum: ${documentType.maxFileSizeMb}MB`;
    }

    return null;
  };

  const handleUpload = async () => {
    if (!uploadState.file || !uploadState.documentTypeId || !uploadState.documentNumber.trim()) {
      setAlert({
        type: 'error',
        message: 'Please fill all required fields and select a file',
      });
      return;
    }

    const documentType = documentTypes.find(dt => dt.id === uploadState.documentTypeId);
    if (!documentType) return;

    const validationError = validateFile(uploadState.file, documentType);
    if (validationError) {
      setAlert({
        type: 'error',
        message: validationError,
      });
      return;
    }

    setUploadState(prev => ({ ...prev, uploading: true, progress: 0 }));

    try {
      const formData = new FormData();
      formData.append('document', uploadState.file);
      formData.append('documentTypeId', uploadState.documentTypeId.toString());
      formData.append('documentNumber', uploadState.documentNumber);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      // TODO: Implement actual API call
      const response = await fetch('/api/employee/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      clearInterval(interval);
      setUploadState(prev => ({ ...prev, progress: 100 }));

      if (response.ok) {
        setAlert({
          type: 'success',
          message: 'Document uploaded successfully',
        });
        fetchEmployeeDocuments(); // Refresh documents list
        setUploadDialog(false);
        resetUploadState();
      } else {
        const error = await response.json();
        setAlert({
          type: 'error',
          message: error.message || 'Failed to upload document',
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setUploadState(prev => ({ ...prev, uploading: false, progress: 0 }));
    }
  };

  const resetUploadState = () => {
    setUploadState({
      file: null,
      documentTypeId: 0,
      documentNumber: '',
      uploading: false,
      progress: 0,
    });
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      // TODO: Implement API call
      const response = await fetch(`/api/employee/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setAlert({
          type: 'success',
          message: 'Document deleted successfully',
        });
        fetchEmployeeDocuments();
      } else {
        const error = await response.json();
        setAlert({
          type: 'error',
          message: error.message || 'Failed to delete document',
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentStatus = (document: EmployeeDocument) => {
    if (document.isVerified) {
      return { label: 'Verified', color: 'success', icon: <CheckCircle /> };
    } else {
      return { label: 'Pending Verification', color: 'warning', icon: <Schedule /> };
    }
  };

  const getCompletionStats = () => {
    const mandatoryDocs = documentTypes.filter(dt => dt.isMandatory);
    const uploadedMandatory = mandatoryDocs.filter(dt => 
      employeeDocuments.some(ed => ed.documentTypeId === dt.id)
    );
    
    return {
      mandatory: uploadedMandatory.length,
      total: mandatoryDocs.length,
      percentage: mandatoryDocs.length > 0 ? (uploadedMandatory.length / mandatoryDocs.length) * 100 : 0,
    };
  };

  const completionStats = getCompletionStats();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Document Upload Center
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialog(true)}
          >
            Upload Document
          </Button>
        </Box>

        {alert && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 3 }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}

        {/* Completion Progress */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Document Completion Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={completionStats.percentage} />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="textSecondary">
                  {Math.round(completionStats.percentage)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {completionStats.mandatory} of {completionStats.total} mandatory documents uploaded
            </Typography>
          </CardContent>
        </Card>

        {/* Document Categories */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Mandatory Documents
            </Typography>
            <List>
              {documentTypes.filter(dt => dt.isMandatory).map((docType) => {
                const uploadedDoc = employeeDocuments.find(ed => ed.documentTypeId === docType.id);
                const status = uploadedDoc ? getDocumentStatus(uploadedDoc) : null;
                
                return (
                  <ListItem key={docType.id}>
                    <ListItemIcon>
                      {uploadedDoc ? (
                        status?.icon
                      ) : (
                        <Error color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={docType.name}
                      secondary={
                        uploadedDoc ? (
                          <Box>
                            <Typography variant="caption" display="block">
                              {uploadedDoc.fileName} • {formatFileSize(uploadedDoc.fileSizeBytes)}
                            </Typography>
                            <Chip
                              label={status?.label}
                              color={status?.color as any}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="error">
                            Not uploaded
                          </Typography>
                        )
                      }
                    />
                    <ListItemSecondaryAction>
                      {uploadedDoc ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {/* TODO: View document */}}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {/* TODO: Download document */}}
                          >
                            <Download />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteDocument(uploadedDoc.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setUploadState(prev => ({ ...prev, documentTypeId: docType.id || 0 }));
                            setUploadDialog(true);
                          }}
                        >
                          Upload
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Optional Documents
            </Typography>
            <List>
              {documentTypes.filter(dt => !dt.isMandatory).map((docType) => {
                const uploadedDoc = employeeDocuments.find(ed => ed.documentTypeId === docType.id);
                const status = uploadedDoc ? getDocumentStatus(uploadedDoc) : null;
                
                return (
                  <ListItem key={docType.id}>
                    <ListItemIcon>
                      {uploadedDoc ? (
                        status?.icon
                      ) : (
                        <Description color="disabled" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={docType.name}
                      secondary={
                        uploadedDoc ? (
                          <Box>
                            <Typography variant="caption" display="block">
                              {uploadedDoc.fileName} • {formatFileSize(uploadedDoc.fileSizeBytes)}
                            </Typography>
                            <Chip
                              label={status?.label}
                              color={status?.color as any}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Optional
                          </Typography>
                        )
                      }
                    />
                    <ListItemSecondaryAction>
                      {uploadedDoc ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {/* TODO: View document */}}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {/* TODO: Download document */}}
                          >
                            <Download />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteDocument(uploadedDoc.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setUploadState(prev => ({ ...prev, documentTypeId: docType.id || 0 }));
                            setUploadDialog(true);
                          }}
                        >
                          Upload
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>
      </Paper>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialog} 
        onClose={() => !uploadState.uploading && setUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={uploadState.documentTypeId}
              onChange={(e) => setUploadState(prev => ({ ...prev, documentTypeId: e.target.value as number }))}
              disabled={uploadState.uploading}
            >
              {documentTypes.map((docType) => (
                <MenuItem key={docType.id} value={docType.id}>
                  {docType.name} {docType.isMandatory && '(Mandatory)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Document Number"
            value={uploadState.documentNumber}
            onChange={(e) => setUploadState(prev => ({ ...prev, documentNumber: e.target.value }))}
            disabled={uploadState.uploading}
            sx={{ mb: 3 }}
            helperText="Enter the document number (e.g., Aadhar number, PAN number)"
          />

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              disabled={uploadState.uploading}
              sx={{ height: 100, border: '2px dashed', borderColor: 'primary.main' }}
            >
              {uploadState.file ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2">{uploadState.file.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatFileSize(uploadState.file.size)}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2">Click to select file</Typography>
                  <Typography variant="caption" color="textSecondary">
                    or drag and drop
                  </Typography>
                </Box>
              )}
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadDialog(false);
              resetUploadState();
            }}
            disabled={uploadState.uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={
              uploadState.uploading || 
              !uploadState.file || 
              !uploadState.documentTypeId || 
              !uploadState.documentNumber.trim()
            }
          >
            {uploadState.uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentUploadForm;