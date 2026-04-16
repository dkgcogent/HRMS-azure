
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

import { DocumentType } from '../../services/api';

interface EmployeeDocument {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  fileName: string;
  filePath: string;
  uploadDate: string;
  isMandatory: boolean;
}

const EmployeeDocuments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    documentTypeId: '',
    description: '',
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      loadDocuments();
      loadDocumentTypes();
    }
  }, [id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setDocuments([
        {
          id: 1,
          documentTypeId: 1,
          documentTypeName: 'Aadhar Card',
          fileName: 'aadhar_card.pdf',
          filePath: '/uploads/documents/aadhar_card.pdf',
          uploadDate: '2023-01-15',
          isMandatory: true,
        },
        {
          id: 2,
          documentTypeId: 2,
          documentTypeName: 'PAN Card',
          fileName: 'pan_card.pdf',
          filePath: '/uploads/documents/pan_card.pdf',
          uploadDate: '2023-01-15',
          isMandatory: true,
        },
      ]);
    } catch (error) {
      console.error('Error loading documents:', error);
      setSnackbar({ open: true, message: 'Failed to load documents', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      const response = await apiService.getDocumentTypes();
      setDocumentTypes(response.data || [
        { id: 1, name: 'Aadhar Card', isMandatory: true },
        { id: 2, name: 'PAN Card', isMandatory: true },
        { id: 3, name: 'Passport', isMandatory: false },
        { id: 4, name: 'Driving License', isMandatory: false },
        { id: 5, name: 'Educational Certificate', isMandatory: false },
        { id: 6, name: 'Experience Certificate', isMandatory: false },
      ]);
    } catch (error) {
      console.error('Error loading document types:', error);
      setDocumentTypes([
        { id: 1, name: 'Aadhar Card', isMandatory: true },
        { id: 2, name: 'PAN Card', isMandatory: true },
        { id: 3, name: 'Passport', isMandatory: false },
      ]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({ open: true, message: 'Please select a PDF or image file', severity: 'error' });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'File size should be less than 5MB', severity: 'error' });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    const docTypeId = formData.documentTypeId ? parseInt(formData.documentTypeId, 10) : 0;
    if (!selectedFile || !docTypeId) {
      setSnackbar({ open: true, message: 'Please select a file and document type', severity: 'error' });
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('documentTypeId', String(docTypeId));
      uploadFormData.append('description', formData.description);

      // Mock upload success
      const newDocument: EmployeeDocument = {
        id: Date.now(),
        documentTypeId: docTypeId,
        documentTypeName: documentTypes.find(dt => dt.id === docTypeId)?.name || '',
        fileName: selectedFile.name,
        filePath: `/uploads/documents/${selectedFile.name}`,
        uploadDate: new Date().toISOString().split('T')[0],
        isMandatory: documentTypes.find(dt => dt.id === docTypeId)?.isMandatory || false,
      };

      setDocuments(prev => [...prev, newDocument]);
      setSnackbar({ open: true, message: 'Document uploaded successfully', severity: 'success' });
      setOpen(false);
      setSelectedFile(null);
      setFormData({ documentTypeId: '', description: '' });
    } catch (error) {
      console.error('Error uploading document:', error);
      setSnackbar({ open: true, message: 'Failed to upload document', severity: 'error' });
    }
  };

  const handleDownload = (document: EmployeeDocument) => {
    // Mock download
    setSnackbar({ open: true, message: `Downloading ${document.fileName}`, severity: 'info' });
  };

  const handleDelete = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        setSnackbar({ open: true, message: 'Document deleted successfully', severity: 'success' });
      } catch (error) {
        console.error('Error deleting document:', error);
        setSnackbar({ open: true, message: 'Failed to delete document', severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DocumentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Employee Documents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Upload Document
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Document Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Upload Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{document.documentTypeName}</TableCell>
                  <TableCell>{document.fileName}</TableCell>
                  <TableCell>{new Date(document.uploadDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={document.isMandatory ? 'Mandatory' : 'Optional'}
                      color={document.isMandatory ? 'error' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(document)}
                      sx={{ mr: 1 }}
                      color="primary"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(document.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No documents uploaded. Click "Upload Document" to add one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={formData.documentTypeId}
                label="Document Type"
                onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value as string })}
              >
                <MenuItem value="" disabled>
                  <em>Select Document Type</em>
                </MenuItem>
                {documentTypes.map((type) => (
                  <MenuItem key={type.id} value={String(type.id)}>
                    {type.name} {type.isMandatory && '(Mandatory)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              {selectedFile ? selectedFile.name : 'Select File (PDF, JPG, PNG)'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
            </Button>
            
            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={!selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeDocuments;
