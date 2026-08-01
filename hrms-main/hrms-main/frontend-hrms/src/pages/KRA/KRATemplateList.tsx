import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  ContentCopy as CloneIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { KRATemplate } from './mockData';

const KRATemplateList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<KRATemplate[]>([]);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<KRATemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await apiService.getKRATemplates();
      if (res.success) setTemplates(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDelete = (template: KRATemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setDeleting(true);
    try {
      const res = await apiService.deleteKRATemplate(templateToDelete.id);
      if (res.success) {
        setSnackbar({ open: true, message: 'KRA Template deleted successfully!', severity: 'success' });
        fetchTemplates();
      } else {
        setSnackbar({ open: true, message: res.message || 'Failed to delete template.', severity: 'error' });
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      setSnackbar({ open: true, message: 'Failed to delete template.', severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleClone = async (template: KRATemplate) => {
    try {
      const tmplRes = await apiService.getKRATemplateById(template.id);
      if (tmplRes.success && tmplRes.data) {
        const fullTmpl = tmplRes.data;
        const newTemplate = {
          name: `Copy of ${fullTmpl.name}`,
          department: fullTmpl.department,
          designation: fullTmpl.designation,
          financialYear: fullTmpl.financialYear,
          effectiveFrom: fullTmpl.effectiveFrom,
          effectiveTo: fullTmpl.effectiveTo,
          status: 'Draft',
          items: (fullTmpl.items || []).map((item: any) => ({
            kraName: item.kraName,
            description: item.description,
            frequency: item.frequency,
            weightage: item.weightage,
          })),
        };

        const createRes = await apiService.createKRATemplate(newTemplate);
        if (createRes.success) {
          setSnackbar({ open: true, message: `Template cloned successfully as "${newTemplate.name}"!`, severity: 'success' });
          fetchTemplates();
        } else {
          setSnackbar({ open: true, message: 'Failed to clone template.', severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error cloning template:', error);
      setSnackbar({ open: true, message: 'Failed to clone template.', severity: 'error' });
    }
  };

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          KRA Templates
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/kra/templates/new')}
        >
          Create New Template
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 2, borderRadius: 2 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Template Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Financial Year</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Last Updated</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                      No templates found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((template) => (
                    <TableRow hover key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.department}</TableCell>
                      <TableCell>{template.designation}</TableCell>
                      <TableCell>{template.financialYear}</TableCell>
                      <TableCell>
                        <Chip 
                          label={template.status} 
                          size="small" 
                          color={template.status === 'Active' ? 'success' : template.status === 'Draft' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{new Date(template.lastUpdated).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => navigate(`/kra/templates/view/${template.id}`)}>
                            <ViewIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/kra/templates/edit/${template.id}`)}>
                            <EditIcon fontSize="small" color="secondary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Clone">
                          <IconButton size="small" onClick={() => handleClone(template)}>
                            <CloneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleOpenDelete(template)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTemplates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete KRA Template <strong>"{templateToDelete?.name}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KRATemplateList;
