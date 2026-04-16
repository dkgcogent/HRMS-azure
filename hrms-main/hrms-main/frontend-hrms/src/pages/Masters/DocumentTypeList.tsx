// @ts-nocheck
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
  Chip,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface DocumentType {
  id: number;
  name: string;
  description: string;
  isMandatory: boolean;
  isActive: boolean;
}

const DocumentTypeList: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingDocumentType, setEditingDocumentType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isMandatory: false,
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDocumentTypes();
      setDocumentTypes(response.data || []);
    } catch (error) {
      console.error('Error loading document types:', error);
      setSnackbar({ open: true, message: 'Failed to load document types', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDocumentType(null);
    setFormData({
      name: '',
      description: '',
      isMandatory: false,
      isActive: true,
    });
    setOpen(true);
  };

  const handleEdit = (documentType: DocumentType) => {
    setEditingDocumentType(documentType);
    setFormData({
      name: documentType.name,
      description: documentType.description,
      isMandatory: documentType.isMandatory,
      isActive: documentType.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingDocumentType) {
        await apiService.updateDocumentType(editingDocumentType.id!, formData);
        setSnackbar({ open: true, message: 'Document type updated successfully', severity: 'success' });
      } else {
        await apiService.createDocumentType(formData);
        setSnackbar({ open: true, message: 'Document type created successfully', severity: 'success' });
      }
      setOpen(false);
      loadDocumentTypes();
    } catch (error) {
      console.error('Error saving document type:', error);
      setSnackbar({ open: true, message: 'Failed to save document type', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this document type?')) {
      try {
        await apiService.deleteDocumentType(id);
        setSnackbar({ open: true, message: 'Document type deleted successfully', severity: 'success' });
        loadDocumentTypes();
      } catch (error) {
        console.error('Error deleting document type:', error);
        setSnackbar({ open: true, message: 'Failed to delete document type', severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DocumentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Document Types
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Add Document Type
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mandatory</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documentTypes.map((docType) => (
                <TableRow key={docType.id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{docType.name}</TableCell>
                  <TableCell>{docType.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={docType.isMandatory ? 'Mandatory' : 'Optional'}
                      color={docType.isMandatory ? 'error' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={docType.isActive ? 'Active' : 'Inactive'}
                      color={docType.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(docType)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(docType.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {documentTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No document types found. Click "Add Document Type" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDocumentType ? 'Edit Document Type' : 'Add New Document Type'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Document Type Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Aadhar Card, PAN Card, Passport"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe what this document is used for and when it's required (e.g., Government-issued identity proof required for all employees during onboarding)"
              helperText="Explain the document's purpose, when it's needed, and any specific requirements"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isMandatory}
                  onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                />
              }
              label="Mandatory Document"
            />

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Status</FormLabel>
              <RadioGroup
                row
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
              >
                <FormControlLabel
                  value="active"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Active</Typography>
                      <Chip label="Visible" size="small" color="success" />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="inactive"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Inactive</Typography>
                      <Chip label="Hidden" size="small" color="default" />
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingDocumentType ? 'Update' : 'Create'}
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

export default DocumentTypeList;
