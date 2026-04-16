// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  DirectionsCar as CarIcon,
  Business as OfficeIcon,
  Assignment as AssignIcon,
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface Asset {
  id?: number;
  assetId: string;
  name: string;
  category: 'IT_EQUIPMENT' | 'FURNITURE' | 'VEHICLE' | 'OFFICE_EQUIPMENT' | 'OTHER';
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  status: 'AVAILABLE' | 'ASSIGNED' | 'UNDER_MAINTENANCE' | 'DISPOSED' | 'LOST';
  location: string;
  assignedTo?: number;
  assignedToName?: string;
  assignmentDate?: string;
  warrantyExpiry?: string;
  description?: string;
  specifications?: string;
}

interface AssetAssignment {
  id?: number;
  assetId: number;
  employeeId: number;
  employeeName: string;
  assignedDate: string;
  returnDate?: string;
  condition: string;
  purpose: string;
  remarks?: string;
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED';
}

interface AssetTransfer {
  fromEmployeeId: number;
  fromEmployeeName: string;
  toEmployeeId: number;
  toEmployeeName: string;
  transferDate: string;
  reason: string;
  condition: string;
  remarks?: string;
}

const assetCategories = [
  { value: 'IT_EQUIPMENT', label: 'IT Equipment', icon: <ComputerIcon /> },
  { value: 'FURNITURE', label: 'Furniture', icon: <OfficeIcon /> },
  { value: 'VEHICLE', label: 'Vehicle', icon: <CarIcon /> },
  { value: 'OFFICE_EQUIPMENT', label: 'Office Equipment', icon: <OfficeIcon /> },
  { value: 'OTHER', label: 'Other', icon: <OfficeIcon /> },
];

const assetConditions = [
  { value: 'EXCELLENT', label: 'Excellent', color: 'success' },
  { value: 'GOOD', label: 'Good', color: 'info' },
  { value: 'FAIR', label: 'Fair', color: 'warning' },
  { value: 'POOR', label: 'Poor', color: 'error' },
  { value: 'DAMAGED', label: 'Damaged', color: 'error' },
];

const assetStatuses = [
  { value: 'AVAILABLE', label: 'Available', color: 'success' },
  { value: 'ASSIGNED', label: 'Assigned', color: 'info' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance', color: 'warning' },
  { value: 'DISPOSED', label: 'Disposed', color: 'default' },
  { value: 'LOST', label: 'Lost', color: 'error' },
];

const AssetManagementForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assets');
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [newAsset, setNewAsset] = useState<Asset>({
    assetId: '',
    name: '',
    category: 'IT_EQUIPMENT',
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: 0,
    currentValue: 0,
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    location: '',
  });

  const [newAssignment, setNewAssignment] = useState<AssetAssignment>({
    assetId: 0,
    employeeId: 0,
    employeeName: '',
    assignedDate: new Date().toISOString().split('T')[0],
    condition: 'GOOD',
    purpose: '',
    status: 'ACTIVE',
  });

  const [newTransfer, setNewTransfer] = useState<AssetTransfer>({
    fromEmployeeId: 0,
    fromEmployeeName: '',
    toEmployeeId: 0,
    toEmployeeName: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
    condition: 'GOOD',
  });

  useEffect(() => {
    loadAssets();
    loadEmployees();
    loadAssignments();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      // In real app: const response = await apiService.getAssets();
      // Mock data
      const mockAssets: Asset[] = [
        {
          id: 1,
          assetId: 'LAP001',
          name: 'Dell Latitude 5520',
          category: 'IT_EQUIPMENT',
          type: 'Laptop',
          brand: 'Dell',
          model: 'Latitude 5520',
          serialNumber: 'DL5520001',
          purchaseDate: '2023-01-15',
          purchasePrice: 75000,
          currentValue: 60000,
          condition: 'GOOD',
          status: 'ASSIGNED',
          location: 'Mumbai Office',
          assignedTo: 1,
          assignedToName: 'John Doe',
          assignmentDate: '2023-02-01',
          warrantyExpiry: '2026-01-15',
          description: 'High-performance laptop for development work',
          specifications: 'Intel i7, 16GB RAM, 512GB SSD',
        },
        {
          id: 2,
          assetId: 'MOB001',
          name: 'iPhone 14',
          category: 'IT_EQUIPMENT',
          type: 'Mobile Phone',
          brand: 'Apple',
          model: 'iPhone 14',
          serialNumber: 'IP14001',
          purchaseDate: '2023-06-01',
          purchasePrice: 80000,
          currentValue: 70000,
          condition: 'EXCELLENT',
          status: 'AVAILABLE',
          location: 'IT Store',
          warrantyExpiry: '2024-06-01',
        },
        {
          id: 3,
          assetId: 'CHR001',
          name: 'Office Chair',
          category: 'FURNITURE',
          type: 'Chair',
          brand: 'Herman Miller',
          model: 'Aeron',
          serialNumber: 'HM001',
          purchaseDate: '2022-12-01',
          purchasePrice: 45000,
          currentValue: 35000,
          condition: 'GOOD',
          status: 'ASSIGNED',
          location: 'Floor 3',
          assignedTo: 2,
          assignedToName: 'Jane Smith',
          assignmentDate: '2022-12-15',
        },
      ];
      setAssets(mockAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      // In real app: const response = await apiService.getEmployees();
      setEmployees([
        { id: 1, name: 'John Doe', department: 'IT' },
        { id: 2, name: 'Jane Smith', department: 'HR' },
        { id: 3, name: 'Mike Johnson', department: 'Finance' },
      ]);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      // In real app: const response = await apiService.getAssetAssignments();
      const mockAssignments: AssetAssignment[] = [
        {
          id: 1,
          assetId: 1,
          employeeId: 1,
          employeeName: 'John Doe',
          assignedDate: '2023-02-01',
          condition: 'GOOD',
          purpose: 'Development work',
          status: 'ACTIVE',
        },
        {
          id: 2,
          assetId: 3,
          employeeId: 2,
          employeeName: 'Jane Smith',
          assignedDate: '2022-12-15',
          condition: 'GOOD',
          purpose: 'Office work',
          status: 'ACTIVE',
        },
      ];
      setAssignments(mockAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAssetChange = (field: keyof Asset, value: any) => {
    setNewAsset(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAsset = async () => {
    if (!newAsset.assetId || !newAsset.name || !newAsset.type) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      // In real app: await apiService.createAsset(newAsset);
      setAssets(prev => [...prev, { ...newAsset, id: Date.now() }]);
      setNewAsset({
        assetId: '',
        name: '',
        category: 'IT_EQUIPMENT',
        type: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: 0,
        currentValue: 0,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
        location: '',
      });
      setSnackbar({ open: true, message: 'Asset added successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error adding asset:', error);
      setSnackbar({ open: true, message: 'Error adding asset', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const assignAsset = async () => {
    if (!newAssignment.employeeId || !newAssignment.purpose) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      // In real app: await apiService.assignAsset(newAssignment);
      
      // Update asset status
      setAssets(prev => prev.map(asset =>
        asset.id === selectedAsset?.id
          ? {
              ...asset,
              status: 'ASSIGNED' as const,
              assignedTo: newAssignment.employeeId,
              assignedToName: employees.find(e => e.id === newAssignment.employeeId)?.name,
              assignmentDate: newAssignment.assignedDate,
            }
          : asset
      ));

      // Add assignment record
      setAssignments(prev => [...prev, { ...newAssignment, id: Date.now() }]);

      setAssignmentDialog(false);
      setSnackbar({ open: true, message: 'Asset assigned successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error assigning asset:', error);
      setSnackbar({ open: true, message: 'Error assigning asset', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const returnAsset = async (assignmentId: number) => {
    try {
      setLoading(true);
      // In real app: await apiService.returnAsset(assignmentId);
      
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        // Update asset status
        setAssets(prev => prev.map(asset =>
          asset.id === assignment.assetId
            ? {
                ...asset,
                status: 'AVAILABLE' as const,
                assignedTo: undefined,
                assignedToName: undefined,
                assignmentDate: undefined,
              }
            : asset
        ));

        // Update assignment status
        setAssignments(prev => prev.map(a =>
          a.id === assignmentId
            ? { ...a, status: 'RETURNED' as const, returnDate: new Date().toISOString().split('T')[0] }
            : a
        ));
      }

      setSnackbar({ open: true, message: 'Asset returned successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error returning asset:', error);
      setSnackbar({ open: true, message: 'Error returning asset', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = assetStatuses.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  const getConditionColor = (condition: string) => {
    const conditionObj = assetConditions.find(c => c.value === condition);
    return conditionObj?.color || 'default';
  };

  const getCategoryIcon = (category: string) => {
    const categoryObj = assetCategories.find(c => c.value === category);
    return categoryObj?.icon || <OfficeIcon />;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Asset Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage company assets, assignments, and tracking.
      </Typography>
      {/* Tab Navigation */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0 }}>
            {[
              { id: 'assets', label: 'Assets', icon: <ComputerIcon /> },
              { id: 'assignments', label: 'Assignments', icon: <AssignIcon /> },
              { id: 'add-asset', label: 'Add Asset', icon: <AddIcon /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'contained' : 'text'}
                startIcon={tab.icon}
                sx={{ borderRadius: 0, minWidth: 150 }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Asset Inventory</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip label={`Total: ${assets.length}`} />
                  <Chip label={`Available: ${assets.filter(a => a.status === 'AVAILABLE').length}`} color="success" />
                  <Chip label={`Assigned: ${assets.filter(a => a.status === 'ASSIGNED').length}`} color="info" />
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
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
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light' }}>
                              {getCategoryIcon(asset.category)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {asset.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {asset.assetId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assetCategories.find(c => c.value === asset.category)?.label}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{asset.brand} {asset.model}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            SN: {asset.serialNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assetStatuses.find(s => s.value === asset.status)?.label}
                            color={getStatusColor(asset.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assetConditions.find(c => c.value === asset.condition)?.label}
                            color={getConditionColor(asset.condition) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {asset.assignedToName ? (
                            <Box>
                              <Typography variant="body2">{asset.assignedToName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Since: {asset.assignmentDate && new Date(asset.assignmentDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not assigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">₹{asset.currentValue.toLocaleString()}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Purchase: ₹{asset.purchasePrice.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Asset">
                              <IconButton size="small" color="primary">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            {asset.status === 'AVAILABLE' && (
                              <Tooltip title="Assign Asset">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setNewAssignment(prev => ({ ...prev, assetId: asset.id || 0 }));
                                    setAssignmentDialog(true);
                                  }}
                                >
                                  <AssignIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {asset.status === 'ASSIGNED' && (
                              <Tooltip title="Transfer Asset">
                                <IconButton size="small" color="warning">
                                  <TransferIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="View History">
                              <IconButton size="small" color="info">
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Asset Assignments
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Employee</TableCell>
                      <TableCell>Assignment Date</TableCell>
                      <TableCell>Purpose</TableCell>
                      <TableCell>Condition</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.map((assignment) => {
                      const asset = assets.find(a => a.id === assignment.assetId);
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {asset?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asset?.assetId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{assignment.employeeName}</TableCell>
                          <TableCell>{new Date(assignment.assignedDate).toLocaleDateString()}</TableCell>
                          <TableCell>{assignment.purpose}</TableCell>
                          <TableCell>
                            <Chip
                              label={assignment.condition}
                              color={getConditionColor(assignment.condition) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={assignment.status}
                              color={assignment.status === 'ACTIVE' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {assignment.status === 'ACTIVE' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => returnAsset(assignment.id || 0)}
                              >
                                Return
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {assignments.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No asset assignments found.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Add Asset Tab */}
          {activeTab === 'add-asset' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Add New Asset
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    required
                    value={newAsset.assetId}
                    onChange={(e) => handleAssetChange('assetId', e.target.value)}
                    placeholder="e.g., LAP001, MOB001"
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label="Asset Name"
                    required
                    value={newAsset.name}
                    onChange={(e) => handleAssetChange('name', e.target.value)}
                    placeholder="e.g., Dell Laptop, iPhone 14"
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newAsset.category}
                      label="Category"
                      onChange={(e) => handleAssetChange('category', e.target.value)}
                    >
                      {assetCategories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <TextField
                    fullWidth
                    label="Type"
                    required
                    value={newAsset.type}
                    onChange={(e) => handleAssetChange('type', e.target.value)}
                    placeholder="e.g., Laptop, Chair, Car"
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <TextField
                    fullWidth
                    label="Brand"
                    value={newAsset.brand}
                    onChange={(e) => handleAssetChange('brand', e.target.value)}
                    placeholder="e.g., Dell, Apple, Herman Miller"
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={newAsset.model}
                    onChange={(e) => handleAssetChange('model', e.target.value)}
                    placeholder="e.g., Latitude 5520, iPhone 14"
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    value={newAsset.serialNumber}
                    onChange={(e) => handleAssetChange('serialNumber', e.target.value)}
                    placeholder="Unique serial number"
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <TextField
                    fullWidth
                    label="Purchase Date"
                    type="date"
                    value={newAsset.purchaseDate}
                    onChange={(e) => handleAssetChange('purchaseDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <TextField
                    fullWidth
                    label="Purchase Price"
                    type="number"
                    value={newAsset.purchasePrice}
                    onChange={(e) => handleAssetChange('purchasePrice', parseFloat(e.target.value) || 0)}
                    InputProps={{ startAdornment: '₹' }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <TextField
                    fullWidth
                    label="Current Value"
                    type="number"
                    value={newAsset.currentValue}
                    onChange={(e) => handleAssetChange('currentValue', parseFloat(e.target.value) || 0)}
                    InputProps={{ startAdornment: '₹' }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={newAsset.condition}
                      label="Condition"
                      onChange={(e) => handleAssetChange('condition', e.target.value)}
                    >
                      {assetConditions.map((condition) => (
                        <MenuItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={newAsset.location}
                    onChange={(e) => handleAssetChange('location', e.target.value)}
                    placeholder="e.g., Mumbai Office, IT Store"
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label="Warranty Expiry"
                    type="date"
                    value={newAsset.warrantyExpiry || ''}
                    onChange={(e) => handleAssetChange('warrantyExpiry', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <TextField
                    fullWidth
                    label="Specifications"
                    value={newAsset.specifications || ''}
                    onChange={(e) => handleAssetChange('specifications', e.target.value)}
                    placeholder="e.g., Intel i7, 16GB RAM, 512GB SSD"
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={newAsset.description || ''}
                    onChange={(e) => handleAssetChange('description', e.target.value)}
                    placeholder="Additional details about the asset..."
                  />
                </Grid>

                <Grid size={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setActiveTab('assets')}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={addAsset}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Asset'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
      {/* Asset Assignment Dialog */}
      <Dialog open={assignmentDialog} onClose={() => setAssignmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Asset: {selectedAsset?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={newAssignment.employeeId}
                  label="Employee"
                  onChange={(e) => {
                    const employeeId = e.target.value as number;
                    const employee = employees.find(emp => emp.id === employeeId);
                    setNewAssignment(prev => ({
                      ...prev,
                      employeeId,
                      employeeName: employee?.name || ''
                    }));
                  }}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                fullWidth
                label="Assignment Date"
                type="date"
                required
                value={newAssignment.assignedDate}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, assignedDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={newAssignment.condition}
                  label="Condition"
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, condition: e.target.value }))}
                >
                  {assetConditions.map((condition) => (
                    <MenuItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Purpose"
                required
                value={newAssignment.purpose}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Purpose of assignment..."
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={2}
                value={newAssignment.remarks || ''}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Additional remarks..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={assignAsset} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Asset'}
          </Button>
        </DialogActions>
      </Dialog>
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

export default AssetManagementForm;
