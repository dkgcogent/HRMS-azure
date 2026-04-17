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
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Work as ProjectIcon,
} from '@mui/icons-material';
import { apiService, Project } from '../../services/api';

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        isActive: true,
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProjects();
            setProjects(response.data || []);
        } catch (error) {
            console.error('Error loading projects:', error);
            setSnackbar({ open: true, message: 'Failed to load projects', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingProject(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            isActive: true,
        });
        setOpen(true);
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            code: project.code || '',
            description: project.description || '',
            isActive: project.isActive ?? true,
        });
        setOpen(true);
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!formData.name.trim()) errors.push('Project name is required');
        if (formData.name.length < 2) errors.push('Project name must be at least 2 characters');

        // Check for duplicate name or code
        const duplicate = projects.find(project =>
            ((project.name || '').toLowerCase() === (formData.name || '').toLowerCase() ||
            (formData.code && (project.code || '').toLowerCase() === (formData.code || '').toLowerCase())) &&
            (!editingProject || project.id !== editingProject.id)
        );

        if (duplicate) {
            if ((duplicate.name || '').toLowerCase() === (formData.name || '').toLowerCase()) {
                errors.push('Project name already exists');
            }
            if (formData.code && (duplicate.code || '').toLowerCase() === (formData.code || '').toLowerCase()) {
                errors.push('Project code already exists');
            }
        }

        return errors;
    };

    const handleSave = async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setSnackbar({
                open: true,
                message: 'Please fix the following errors:\n' + validationErrors.join('\n'),
                severity: 'error'
            });
            return;
        }

        try {
            if (editingProject) {
                await apiService.updateProject(editingProject.id!, formData);
                setSnackbar({ open: true, message: 'Project updated successfully', severity: 'success' });
            } else {
                await apiService.createProject(formData);
                setSnackbar({ open: true, message: 'Project created successfully', severity: 'success' });
            }
            setOpen(false);
            loadProjects();
        } catch (error: any) {
            console.error('Error saving project:', error);
            setSnackbar({ open: true, message: 'Failed to save project: ' + (error.response?.data?.message || error.message || 'Unknown error'), severity: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await apiService.deleteProject(id);
                setSnackbar({ open: true, message: 'Project deleted successfully', severity: 'success' });
                loadProjects();
            } catch (error: any) {
                console.error('Error deleting project:', error);
                setSnackbar({ open: true, message: 'Failed to delete project: ' + (error.response?.data?.message || error.message || 'It may be in use.'), severity: 'error' });
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ProjectIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Project Management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    sx={{ borderRadius: 2 }}
                >
                    Add Project
                </Button>
            </Box>

            <Paper elevation={2}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow key={project.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {project.code || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'medium' }}>{project.name}</TableCell>
                                    <TableCell>{project.description}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={project.isActive ? 'Active' : 'Inactive'}
                                            color={project.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(project)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(project.id!)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {projects.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            No projects found. Click "Add Project" to create one.
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
                    {editingProject ? 'Edit Project' : 'Add New Project'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Project Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            fullWidth
                            placeholder="e.g., PROJ001"
                            helperText="Optional unique code for the project"
                        />
                        <TextField
                            label="Project Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                            placeholder="e.g., Project Alpha"
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Enter project details"
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
                                    label="Active"
                                />
                                <FormControlLabel
                                    value="inactive"
                                    control={<Radio />}
                                    label="Inactive"
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {editingProject ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

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

export default ProjectList;
