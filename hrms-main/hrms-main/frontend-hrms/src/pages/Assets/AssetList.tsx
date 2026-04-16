// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Computer as ComputerIcon,
  DirectionsCar as CarIcon,
  Business as OfficeIcon,
  Chair as ChairIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CSVExportButton from '../../components/CSVExportButton';


interface Asset {
  id: number;
  asset_id: string;
  name: string;
  category: string;
  type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_price?: number;
  current_value?: number;
  condition: string;
  status: string;
  location?: string;
  assigned_to?: number;
  first_name?: string;
  last_name?: string;
  emp_id?: string;
  assigned_employee_id?: number;
  primary_photo?: string;
}

const AssetList: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/assets?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        const assetsData = result.data || [];
        
        // Backend automatically fixes inconsistent assets, but check if any remain
        // If backend fix didn't work, fix locally in the UI
        const inconsistentAssets = assetsData.filter((asset: Asset) => 
          asset.status === 'ASSIGNED' && (!asset.assigned_to || asset.assigned_to === null)
        );
        
        if (inconsistentAssets.length > 0) {
          console.log(`[AssetList] Found ${inconsistentAssets.length} inconsistent assets. Backend should have fixed these.`);
          // Fix locally in UI (backend should have already fixed in DB)
          const fixedAssets = assetsData.map((asset: Asset) => {
            if (asset.status === 'ASSIGNED' && (!asset.assigned_to || asset.assigned_to === null)) {
              return { ...asset, status: 'AVAILABLE' as const };
            }
            return asset;
          });
          setAssets(fixedAssets);
          return;
        }
        
        // Debug: Log assignment data for ASSIGNED assets
        console.log('[AssetList] ===== LOADED ASSETS DEBUG =====');
        console.log('[AssetList] Total assets loaded:', assetsData.length);
        
        const assignedAssets = assetsData.filter((asset: Asset) => asset.status === 'ASSIGNED');
        console.log('[AssetList] ASSIGNED assets count:', assignedAssets.length);
        
        assignedAssets.forEach((asset: Asset) => {
            console.log(`[AssetList] ASSIGNED Asset ${asset.id} (${asset.name}):`, {
              assigned_to: asset.assigned_to,
            first_name: asset.first_name || 'NULL',
            last_name: asset.last_name || 'NULL',
            emp_id: asset.emp_id || 'NULL',
            status: asset.status,
            hasEmployeeName: !!(asset.first_name && asset.last_name)
          });
          
          // If assigned but no name, log warning
          if (asset.assigned_to && !asset.first_name) {
            console.warn(`[AssetList] ⚠️ Asset ${asset.id} is assigned to employee ${asset.assigned_to} but has no employee name!`);
          }
        });
        console.log('[AssetList] ===== END DEBUG =====');
        
        setAssets(assetsData);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchTerm]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Refresh assets when page comes into focus (e.g., when returning from edit page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[AssetList] Page focused, refreshing assets...');
      loadAssets();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadAssets]);

  const handleSearch = () => {
    loadAssets();
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/assets/${selectedAsset.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete asset' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Asset "${selectedAsset.name}" deleted successfully`,
          severity: 'success',
        });
        loadAssets();
        setDeleteDialog(false);
        setSelectedAsset(null);
      } else {
        throw new Error(result.message || 'Failed to delete asset');
      }
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete asset. Please try again.',
        severity: 'error',
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'IT_EQUIPMENT':
        return <ComputerIcon />;
      case 'FURNITURE':
        return <ChairIcon />;
      case 'VEHICLE':
        return <CarIcon />;
      case 'OFFICE_EQUIPMENT':
        return <OfficeIcon />;
      default:
        return <OfficeIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'ASSIGNED':
        return 'primary';
      case 'UNDER_MAINTENANCE':
        return 'warning';
      case 'DISPOSED':
      case 'LOST':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'success';
      case 'GOOD':
        return 'info';
      case 'FAIR':
        return 'warning';
      case 'POOR':
      case 'DAMAGED':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        asset.name.toLowerCase().includes(search) ||
        asset.asset_id.toLowerCase().includes(search) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const stats = {
    total: assets.length,
    available: assets.filter((a) => a.status === 'AVAILABLE').length,
    assigned: assets.filter((a) => a.status === 'ASSIGNED').length,
    maintenance: assets.filter((a) => a.status === 'UNDER_MAINTENANCE').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Asset Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track all company assets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <CSVExportButton
            exportType="ASSETS"
            variant="outlined"
            color="primary"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/assets/new')}
          >
            Add Asset
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" component="div">
                Total Assets
              </Typography>
              <Typography variant="h4" component="div">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" component="div">
                Available
              </Typography>
              <Typography variant="h4" color="success.main" component="div">
                {stats.available}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" component="div">
                Assigned
              </Typography>
              <Typography variant="h4" color="primary.main" component="div">
                {stats.assigned}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" component="div">
                Under Maintenance
              </Typography>
              <Typography variant="h4" color="warning.main" component="div">
                {stats.maintenance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search by name, asset ID, or serial number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label" shrink={!!categoryFilter || true}>Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                displayEmpty
                renderValue={(selected: any) => {
                  if (!selected || selected === '') {
                    return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>All Categories</span>;
                  }
                  const categoryLabels: { [key: string]: string } = {
                    'IT_EQUIPMENT': 'IT Equipment',
                    'FURNITURE': 'Furniture',
                    'VEHICLE': 'Vehicle',
                    'OFFICE_EQUIPMENT': 'Office Equipment',
                    'OTHER': 'Other',
                  };
                  return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{categoryLabels[selected] || selected}</span>;
                }}
                sx={{
                  '& .MuiSelect-select': {
                    paddingLeft: '20px !important',
                    paddingRight: '40px !important',
                    paddingTop: '14px !important',
                    paddingBottom: '14px !important',
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    width: '100% !important',
                    boxSizing: 'border-box',
                    '@media (max-width:600px)': {
                      paddingLeft: '16px !important',
                      paddingRight: '32px !important',
                      paddingTop: '10px !important',
                      paddingBottom: '10px !important',
                    },
                  },
                  '& .MuiSelect-select > span': {
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    maxWidth: 'none !important',
                    width: 'auto !important',
                  },
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="IT_EQUIPMENT">IT Equipment</MenuItem>
                <MenuItem value="FURNITURE">Furniture</MenuItem>
                <MenuItem value="VEHICLE">Vehicle</MenuItem>
                <MenuItem value="OFFICE_EQUIPMENT">Office Equipment</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="asset-status-filter-label" shrink={!!statusFilter || true}>Status</InputLabel>
              <Select
                labelId="asset-status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                renderValue={(selected: any) => {
                  if (!selected || selected === '') {
                    return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap', width: '100%' }}>All Status</span>;
                  }
                  const statusLabels: { [key: string]: string } = {
                    'AVAILABLE': 'Available',
                    'ASSIGNED': 'Assigned',
                    'UNDER_MAINTENANCE': 'Under Maintenance',
                    'DISPOSED': 'Disposed',
                    'LOST': 'Lost',
                  };
                  return <span style={{ color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem', display: 'inline-block', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>{statusLabels[selected] || selected}</span>;
                }}
                sx={{
                  '& .MuiSelect-select': {
                    paddingLeft: '20px !important',
                    paddingRight: '40px !important',
                    paddingTop: '14px !important',
                    paddingBottom: '14px !important',
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    width: '100% !important',
                    boxSizing: 'border-box',
                    '@media (max-width:600px)': {
                      paddingLeft: '16px !important',
                      paddingRight: '32px !important',
                      paddingTop: '10px !important',
                      paddingBottom: '10px !important',
                    },
                  },
                  '& .MuiSelect-select > span': {
                    overflow: 'visible !important',
                    textOverflow: 'clip !important',
                    whiteSpace: 'nowrap !important',
                    maxWidth: 'none !important',
                    width: 'auto !important',
                  },
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="AVAILABLE">Available</MenuItem>
                <MenuItem value="ASSIGNED">Assigned</MenuItem>
                <MenuItem value="UNDER_MAINTENANCE">Under Maintenance</MenuItem>
                <MenuItem value="DISPOSED">Disposed</MenuItem>
                <MenuItem value="LOST">Lost</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Assets Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {asset.primary_photo ? (
                        <Avatar src={`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}${asset.primary_photo}`} variant="rounded" />
                      ) : (
                        <Avatar variant="rounded">{getCategoryIcon(asset.category)}</Avatar>
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" component="div">
                          {asset.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div">
                          {asset.asset_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={asset.category.replace('_', ' ')} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" component="div">
                      {asset.brand && asset.model
                        ? `${asset.brand} ${asset.model}`
                        : asset.type}
                    </Typography>
                    {asset.serial_number && (
                      <Typography variant="caption" color="text.secondary" component="div">
                        SN: {asset.serial_number}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={asset.status.replace('_', ' ')}
                      color={getStatusColor(asset.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={asset.condition}
                      color={getConditionColor(asset.condition)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {/* Display employee info if available */}
                    {asset.status === 'ASSIGNED' ? (
                      asset.assigned_to ? (
                      asset.first_name && asset.last_name ? (
                        <Box>
                          <Typography variant="body2" component="div" fontWeight="medium">
                            {asset.first_name} {asset.last_name}
                          </Typography>
                          {(asset.emp_id || asset.assigned_to) && (
                            <Typography variant="caption" color="text.secondary" component="div">
                              {asset.emp_id ? `Emp ID: ${asset.emp_id}` : `Employee ID: ${asset.assigned_to}`}
                            </Typography>
                          )}
                        </Box>
                        ) : (
                        <Box>
                          <Typography variant="body2" color="primary" component="div" fontWeight="medium">
                            Employee ID: {asset.assigned_to}
                          </Typography>
                          {asset.emp_id && (
                            <Typography variant="caption" color="text.secondary" component="div">
                              Emp ID: {asset.emp_id}
                            </Typography>
                          )}
                          <Typography variant="caption" color="warning.main" component="div" sx={{ mt: 0.5 }}>
                              (Fetching employee name...)
                          </Typography>
                        </Box>
                        )
                      ) : (
                        <Typography variant="body2" color="error.main" component="div">
                          ⚠️ Assigned (No employee ID)
                        </Typography>
                      )
                    ) : (
                      <Typography variant="body2" color="text.secondary" component="div">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {asset.current_value && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold" component="div">
                          ₹{asset.current_value.toLocaleString()}
                        </Typography>
                        {asset.purchase_price && (
                          <Typography variant="caption" color="text.secondary" component="div">
                            Purchase: ₹{asset.purchase_price.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/assets/${asset.id}/edit`)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setDeleteDialog(true);
                        }}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent>
          <Typography component="div">
            Are you sure you want to delete asset "{selectedAsset?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssetList;


