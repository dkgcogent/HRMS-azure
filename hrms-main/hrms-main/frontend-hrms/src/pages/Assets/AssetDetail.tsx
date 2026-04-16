// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Grid as MuiGrid,
  GridProps,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  History as HistoryIcon,
  Assignment as AssignIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  DirectionsCar as CarIcon,
  Business as OfficeIcon,
  Chair as ChairIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import AssetHistory from './AssetHistory';

// Grid v2 - use MuiGrid directly with size prop (no wrapper needed for v2)
const Grid = MuiGrid;

interface Asset {
  id: number;
  asset_id: string;
  name: string;
  category: string;
  type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  vendor_name?: string;
  invoice_number?: string;
  depreciation_method?: string;
  depreciation_rate?: number;
  useful_life_years?: number;
  condition: string;
  status: string;
  location?: string;
  assigned_to?: number;
  first_name?: string;
  last_name?: string;
  warranty_expiry?: string;
  description?: string;
  specifications?: string;
  photos?: Array<{ id: number; photo_path: string; photo_name: string; is_primary: boolean }>;
}

const AssetDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (id) {
      loadAsset(parseInt(id));
    }
  }, [id]);

  const loadAsset = async (assetId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}/api/assets/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch asset:', response.status, response.statusText);
        setAsset(null);
        return;
      }
      
      const result = await response.json();
      console.log('Asset API response:', result);
      console.log('Asset photos:', result.data?.photos);
      
      if (result.success && result.data) {
        console.log('Setting asset with photos:', result.data.photos?.length || 0, 'photos');
        setAsset(result.data);
      } else {
        console.error('Asset not found or API error:', result.message || 'Unknown error');
        setAsset(null);
      }
    } catch (error) {
      console.error('Error loading asset:', error);
      setAsset(null);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!asset) {
    return <Box>Asset not found</Box>;
  }

  const primaryPhoto = asset.photos?.find((p) => p.is_primary) || asset.photos?.[0];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/assets')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              {asset.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Asset ID: {asset.asset_id}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/assets/${id}/edit`)}
        >
          Edit Asset
        </Button>
      </Box>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Photos" icon={<ComputerIcon />} iconPosition="start" />
          <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Details Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Left Column - Photos & Basic Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              {primaryPhoto ? (
                <Box
                  component="img"
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:3004'}${primaryPhoto.photo_path}`}
                  alt={asset.name}
                  onError={(e) => {
                    console.error('Error loading primary photo:', primaryPhoto.photo_path);
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                  sx={{ width: '100%', borderRadius: 2, mb: 2 }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  {getCategoryIcon(asset.category)}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={asset.status.replace('_', ' ')}
                  color={getStatusColor(asset.status)}
                  size="small"
                />
                <Chip
                  label={asset.condition}
                  color={getConditionColor(asset.condition)}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Current Value
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                ₹{asset.current_value?.toLocaleString() || 'N/A'}
              </Typography>
              {asset.purchase_price && (
                <Typography variant="caption" color="text.secondary">
                  Purchase Price: ₹{asset.purchase_price.toLocaleString()}
                </Typography>
              )}
            </Paper>

            {/* Assignment Info */}
            {asset.assigned_to && (
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Assigned To
                </Typography>
                <Typography variant="body1">
                  {asset.first_name} {asset.last_name}
                </Typography>
                <Button
                  size="small"
                  startIcon={<AssignIcon />}
                  sx={{ mt: 1 }}
                >
                  View Assignment
                </Button>
              </Paper>
            )}
          </Grid>

          {/* Right Column - Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Asset Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {asset.category.replace('_', ' ')}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {asset.type}
                  </Typography>
                </Grid>

                {asset.brand && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Brand
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.brand}
                    </Typography>
                  </Grid>
                )}

                {asset.model && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Model
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.model}
                    </Typography>
                  </Grid>
                )}

                {asset.serial_number && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Serial Number
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.serial_number}
                    </Typography>
                  </Grid>
                )}

                {asset.location && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.location}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Purchase Information
              </Typography>
              <Grid container spacing={2}>
                {asset.purchase_date && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Purchase Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {new Date(asset.purchase_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}

                {asset.vendor_name && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Vendor
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.vendor_name}
                    </Typography>
                  </Grid>
                )}

                {asset.invoice_number && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.invoice_number}
                    </Typography>
                  </Grid>
                )}

                {asset.warranty_expiry && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Warranty Expiry
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {new Date(asset.warranty_expiry).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}

                {asset.depreciation_method && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Depreciation Method
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.depreciation_method.replace('_', ' ')}
                    </Typography>
                  </Grid>
                )}

                {asset.depreciation_rate && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Depreciation Rate
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {asset.depreciation_rate}% per year
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {asset.description && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {asset.description}
                  </Typography>
                </>
              )}

              {asset.specifications && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Specifications
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {asset.specifications}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Photos Tab */}
      {activeTab === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          {(() => {
            console.log('Photos tab - asset.photos:', asset.photos);
            console.log('Photos array length:', asset.photos?.length || 0);
            console.log('Photos check:', asset.photos && Array.isArray(asset.photos) && asset.photos.length > 0);
            
            if (asset.photos && Array.isArray(asset.photos) && asset.photos.length > 0) {
              return (
                <ImageList cols={3} gap={16}>
                  {asset.photos.map((photo: any) => {
                    const photoUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3004'}${photo.photo_path}`;
                    console.log('Rendering photo:', { id: photo.id, path: photo.photo_path, url: photoUrl });
                    return (
                      <ImageListItem key={photo.id}>
                        <img
                          src={photoUrl}
                          alt={photo.photo_name || `Asset photo ${photo.id}`}
                          loading="lazy"
                          onError={(e) => {
                            console.error('Error loading photo:', {
                              photo_path: photo.photo_path,
                              full_url: photoUrl,
                              photo_id: photo.id
                            });
                            const img = e.target as HTMLImageElement;
                            // Try to load from fallback or show error
                            img.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #666; font-size: 12px;';
                            errorDiv.textContent = 'Image not found';
                            img.parentElement?.appendChild(errorDiv);
                          }}
                          onLoad={() => {
                            console.log('Photo loaded successfully:', photoUrl);
                          }}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                        />
                        <ImageListItemBar
                          title={photo.is_primary ? 'Primary Photo' : (photo.photo_name || `Photo ${photo.id}`)}
                          subtitle={photo.is_primary ? 'Main photo' : ''}
                          position="top"
                        />
                      </ImageListItem>
                    );
                  })}
                </ImageList>
              );
            } else {
              return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No photos uploaded for this asset
                  </Typography>
                  {asset.photos !== undefined && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      (Photos array: {JSON.stringify(asset.photos)})
                    </Typography>
                  )}
                </Box>
              );
            }
          })()}
        </Paper>
      )}

      {/* History Tab */}
      {activeTab === 2 && <AssetHistory assetId={parseInt(id!)} />}
    </Box>
  );
};

export default AssetDetail;

