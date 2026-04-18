// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { FormContainer, FormSection, FormField } from '../../components/Forms';
import {
  Box,
  Button,
  Chip,
  Grid,
  Alert,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  PhotoCamera as PhotoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, API_BASE_URL, getPublicUrl } from '../../services/api';

interface AssetFormData {
  name: string;
  category: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  vendorName: string;
  invoiceNumber: string;
  depreciationMethod: string;
  depreciationRate: string;
  usefulLifeYears: string;
  condition: string;
  status: string;
  location: string;
  assignedTo: string;
  assignmentDate: string;
  warrantyExpiry: string;
  description: string;
  specifications: string;
}

const AssetForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Array<{ id: number; photo_path: string; photo_name: string; is_primary: boolean }>>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<number[]>([]); // Track photos to delete
  const [errors, setErrors] = useState<Partial<Record<keyof AssetFormData, string>>>({});

  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    category: 'IT_EQUIPMENT',
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    vendorName: '',
    invoiceNumber: '',
    depreciationMethod: 'STRAIGHT_LINE',
    depreciationRate: '10',
    usefulLifeYears: '5',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    location: '',
    assignedTo: '',
    assignmentDate: '',
    warrantyExpiry: '',
    description: '',
    specifications: '',
  });

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadEmployees();
    if (isEdit && id) {
      loadAsset(parseInt(id));
    }
  }, [isEdit, id]);

  // Helper function to convert ISO date to yyyy-MM-dd format for date inputs
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    // If already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // If it's an ISO datetime string, extract just the date part
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const loadAsset = async (assetId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const result = await response.json();
      if (result.success && result.data) {
        const asset = result.data;
        setFormData({
          name: asset.name || '',
          category: asset.category || 'IT_EQUIPMENT',
          type: asset.type || '',
          brand: asset.brand || '',
          model: asset.model || '',
          serialNumber: asset.serial_number || '',
          purchaseDate: formatDateForInput(asset.purchase_date),
          purchasePrice: asset.purchase_price?.toString() || '',
          vendorName: asset.vendor_name || '',
          invoiceNumber: asset.invoice_number || '',
          depreciationMethod: asset.depreciation_method || 'STRAIGHT_LINE',
          depreciationRate: asset.depreciation_rate?.toString() || '10',
          usefulLifeYears: asset.useful_life_years?.toString() || '5',
          condition: asset.condition || 'EXCELLENT',
          status: asset.status || 'AVAILABLE',
          location: asset.location || '',
          assignedTo: asset.assigned_to ? String(asset.assigned_to) : '',
          assignmentDate: formatDateForInput(asset.assignment_date),
          warrantyExpiry: formatDateForInput(asset.warranty_expiry),
          description: asset.description || '',
          specifications: asset.specifications || '',
        });
        // Ensure current_value is a number or null
        const currentValue = asset.current_value;
        setCalculatedValue(
          currentValue !== null && currentValue !== undefined && !isNaN(Number(currentValue))
            ? Number(currentValue)
            : null
        );
        
        // Load existing photos
        if (asset.photos && Array.isArray(asset.photos) && asset.photos.length > 0) {
          setExistingPhotos(asset.photos);
          console.log('Loaded existing photos:', asset.photos);
        } else {
          setExistingPhotos([]);
        }
        // Reset deleted photos list when loading asset
        setDeletedPhotoIds([]);
      }
    } catch (error) {
      console.error('Error loading asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees(1, 1000, '');
      console.log('Employee API Response:', response);
      
      if (response.success && response.data) {
        let employeeList = [];
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          employeeList = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          employeeList = response.data.content;
        } else if (response.data.employees && Array.isArray(response.data.employees)) {
          employeeList = response.data.employees;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          employeeList = response.data.data;
        }
        
        console.log('Loaded employees:', employeeList);
        setEmployees(employeeList);
        
        if (employeeList.length === 0) {
          console.warn('No employees found in response');
        }
      } else {
        console.warn('Employee API response not successful:', response);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      // Try direct API call as fallback
      try {
        const directResponse = await fetch(`${API_BASE_URL}/api/employees`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        const directData = await directResponse.json();
        console.log('Direct API Response:', directData);
        if (directData.success && directData.data && Array.isArray(directData.data)) {
          setEmployees(directData.data);
        }
      } catch (fallbackError) {
        console.error('Fallback API call also failed:', fallbackError);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error
    if (errors[name as keyof AssetFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Auto-calculate depreciation when purchase details change
    if ((name === 'purchasePrice' || name === 'purchaseDate' || name === 'depreciationMethod' || name === 'depreciationRate' || name === 'usefulLifeYears') && formData.purchasePrice && formData.purchaseDate) {
      calculateDepreciation();
    }
  };

  const calculateDepreciation = async () => {
    if (!formData.purchasePrice || !formData.purchaseDate) {
      setCalculatedValue(null);
      return;
    }

    try {
      setCalculating(true);
      const response = await fetch(`${API_BASE_URL}/api/assets/calculate-depreciation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          purchasePrice: parseFloat(formData.purchasePrice),
          purchaseDate: formData.purchaseDate,
          depreciationMethod: formData.depreciationMethod,
          depreciationRate: parseFloat(formData.depreciationRate),
          usefulLifeYears: parseInt(formData.usefulLifeYears),
        }),
      });
      const result = await response.json();
      if (result.success) {
        // Ensure currentValue is a number or null
        const currentValue = result.data.currentValue;
        setCalculatedValue(
          currentValue !== null && currentValue !== undefined && !isNaN(Number(currentValue))
            ? Number(currentValue)
            : null
        );
      }
    } catch (error) {
      console.error('Error calculating depreciation:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (photoId: number) => {
    // Remove from display
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    // Track for deletion when saving
    setDeletedPhotoIds((prev) => [...prev, photoId]);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AssetFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Asset type is required';
    }

    if (!formData.condition) {
      newErrors.condition = 'Condition is required';
    }

    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
      newErrors.purchasePrice = 'Please enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to format date to YYYY-MM-DD (MySQL DATE format)
  const formatDateForDB = (dateString: string | undefined): string | undefined => {
    if (!dateString) return undefined;
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // If it's an ISO datetime string, extract just the date part
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        purchaseDate: formatDateForDB(formData.purchaseDate),
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        vendorName: formData.vendorName || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        depreciationMethod: formData.depreciationMethod,
        depreciationRate: parseFloat(formData.depreciationRate),
        usefulLifeYears: parseInt(formData.usefulLifeYears),
        condition: formData.condition,
        status: formData.status,
        location: formData.location || undefined,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : undefined,
        assignmentDate: formatDateForDB(formData.assignmentDate),
        warrantyExpiry: formatDateForDB(formData.warrantyExpiry),
        description: formData.description || undefined,
        specifications: formData.specifications || undefined,
      };

      let assetId = id;
      if (isEdit) {
        // Update
        const response = await fetch(`${API_BASE_URL}/api/assets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to update asset');
        }
      } else {
        // Create
        const response = await fetch(`${API_BASE_URL}/api/assets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to create asset');
        }
        assetId = result.data.id;
      }

      // Handle photos: delete removed ones and upload new ones
      if (assetId) {
        // Delete removed existing photos
        if (deletedPhotoIds.length > 0) {
          console.log('Deleting photos:', deletedPhotoIds);
          for (const photoId of deletedPhotoIds) {
            try {
              const deleteResponse = await fetch(`${API_BASE_URL}/api/assets/${assetId}/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
              });

              if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json().catch(() => ({ message: 'Failed to delete photo' }));
                console.warn(`Failed to delete photo ${photoId}:`, errorData.message);
              } else {
                console.log(`Photo ${photoId} deleted successfully`);
              }
            } catch (error) {
              console.error(`Error deleting photo ${photoId}:`, error);
            }
          }
        }

        // Upload new photos if any
        if (photos.length > 0) {
          const formDataPhotos = new FormData();
          photos.forEach((photo) => {
            formDataPhotos.append('photos', photo);
          });

          const photoResponse = await fetch(`${API_BASE_URL}/api/assets/${assetId}/photos`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: formDataPhotos,
          });

          if (!photoResponse.ok) {
            const errorData = await photoResponse.json().catch(() => ({ message: 'Failed to upload photos' }));
            console.warn('Failed to upload photos:', errorData.message);
            // Don't throw - asset was saved, just photos failed
          } else {
            console.log('Photos uploaded successfully');
          }
        }
      }

      // Navigate to asset detail page to see updated photos
      navigate(`/assets/${assetId}`);
    } catch (error: any) {
      console.error('Error saving asset:', error);
      alert(error.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/assets');
  };

  const categoryOptions = [
    { value: 'IT_EQUIPMENT', label: 'IT Equipment' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'VEHICLE', label: 'Vehicle' },
    { value: 'OFFICE_EQUIPMENT', label: 'Office Equipment' },
    { value: 'OTHER', label: 'Other' },
  ];

  const conditionOptions = [
    { value: 'EXCELLENT', label: 'Excellent' },
    { value: 'GOOD', label: 'Good' },
    { value: 'FAIR', label: 'Fair' },
    { value: 'POOR', label: 'Poor' },
    { value: 'DAMAGED', label: 'Damaged' },
  ];

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
    { value: 'DISPOSED', label: 'Disposed' },
    { value: 'LOST', label: 'Lost' },
  ];

  const depreciationMethodOptions = [
    { value: 'STRAIGHT_LINE', label: 'Straight Line' },
    { value: 'PERCENTAGE', label: 'Percentage Based' },
  ];

  return (
    <FormContainer
      title={isEdit ? 'Edit Asset' : 'Add New Asset'}
      subtitle={isEdit ? 'Update asset information and details' : 'Fill in all required fields to register a new asset. Asset ID will be auto-generated.'}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel={isEdit ? 'Update Asset' : 'Create Asset'}
      loading={loading}
    >
      {/* Basic Information */}
      <FormSection title="Basic Information" subtitle="Enter the asset's basic details" columns={2}>
        <FormField
          name="name"
          label="Asset Name"
          placeholder="Enter asset name (e.g., Dell Latitude 5520)"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

        <FormField
          name="category"
          label="Category"
          placeholder="Select asset category"
          value={formData.category}
          onChange={handleChange}
          error={!!errors.category}
          helperText={errors.category}
          required
          select
          options={categoryOptions}
        />

        <FormField
          name="type"
          label="Asset Type"
          placeholder="Enter asset type (e.g., Laptop, Chair, Car)"
          value={formData.type}
          onChange={handleChange}
          error={!!errors.type}
          helperText={errors.type}
          required
        />

        <FormField
          name="condition"
          label="Condition"
          placeholder="Select current condition"
          value={formData.condition}
          onChange={handleChange}
          error={!!errors.condition}
          helperText={errors.condition}
          required
          select
          options={conditionOptions}
        />

        <FormField
          name="status"
          label="Status"
          placeholder="Select asset status"
          value={formData.status}
          onChange={handleChange}
          select
          options={statusOptions}
        />

        <FormField
          name="location"
          label="Location"
          placeholder="Enter asset location (e.g., Office Floor 2, Warehouse)"
          value={formData.location}
          onChange={handleChange}
        />

        <FormField
          name="assignedTo"
          label="Assigned To"
          placeholder="Select employee to assign this asset"
          value={formData.assignedTo}
          onChange={handleChange}
          select
          options={employees.map(emp => ({
            value: String(emp.id),
            label: `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeId ? `(${emp.employeeId})` : ''}`.trim() || emp.name || `Employee ${emp.id}`
          }))}
        />

        {formData.assignedTo && (
          <FormField
            name="assignmentDate"
            label="Assignment Date"
            placeholder="Select assignment date"
            value={formData.assignmentDate}
            onChange={handleChange}
            type="date"
          />
        )}
      </FormSection>

      {/* Asset Details */}
      <FormSection title="Asset Details" subtitle="Enter brand, model, and serial number" columns={2}>
        <FormField
          name="brand"
          label="Brand"
          placeholder="Enter brand name (e.g., Dell, Apple, Herman Miller)"
          value={formData.brand}
          onChange={handleChange}
        />

        <FormField
          name="model"
          label="Model"
          placeholder="Enter model number or name"
          value={formData.model}
          onChange={handleChange}
        />

        <FormField
          name="serialNumber"
          label="Serial Number"
          placeholder="Enter unique serial number"
          value={formData.serialNumber}
          onChange={handleChange}
        />
      </FormSection>

      {/* Purchase Information */}
      <FormSection title="Purchase Information" subtitle="Enter purchase details for depreciation calculation" columns={2}>
        <FormField
          name="purchaseDate"
          label="Purchase Date"
          placeholder="Select purchase date"
          type="date"
          value={formData.purchaseDate}
          onChange={handleChange}
        />

        <FormField
          name="purchasePrice"
          label="Purchase Price"
          placeholder="Enter purchase price in ₹"
          type="number"
          value={formData.purchasePrice}
          onChange={handleChange}
          error={!!errors.purchasePrice}
          helperText={errors.purchasePrice}
          inputProps={{ min: 0, step: 0.01 }}
        />

        <FormField
          name="vendorName"
          label="Vendor Name"
          placeholder="Enter vendor or supplier name"
          value={formData.vendorName}
          onChange={handleChange}
        />

        <FormField
          name="invoiceNumber"
          label="Invoice Number"
          placeholder="Enter invoice or bill number"
          value={formData.invoiceNumber}
          onChange={handleChange}
        />

        <FormField
          name="warrantyExpiry"
          label="Warranty Expiry"
          placeholder="Select warranty expiry date"
          type="date"
          value={formData.warrantyExpiry}
          onChange={handleChange}
        />
      </FormSection>

      {/* Depreciation Settings */}
      <FormSection title="Depreciation Settings" subtitle="Configure depreciation method and rates" columns={2}>
        <FormField
          name="depreciationMethod"
          label="Depreciation Method"
          placeholder="Select depreciation calculation method"
          value={formData.depreciationMethod}
          onChange={handleChange}
          select
          options={depreciationMethodOptions}
        />

        <FormField
          name="depreciationRate"
          label="Depreciation Rate (%)"
          placeholder="Enter annual depreciation rate"
          type="number"
          value={formData.depreciationRate}
          onChange={handleChange}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
        />

        <FormField
          name="usefulLifeYears"
          label="Useful Life (Years)"
          placeholder="Enter expected useful life in years"
          type="number"
          value={formData.usefulLifeYears}
          onChange={handleChange}
          inputProps={{ min: 1, max: 50 }}
        />

        {calculatedValue !== null && calculatedValue !== undefined && typeof calculatedValue === 'number' && !isNaN(calculatedValue) && (
          <Box>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Calculated Current Value:</strong> ₹{calculatedValue.toFixed(2)}
                {calculating && ' (Calculating...)'}
              </Typography>
            </Alert>
          </Box>
        )}
      </FormSection>

      {/* Asset Photos */}
      <FormSection title="Asset Photos" subtitle="Upload one or multiple photos of the asset" columns={1}>
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            multiple
            type="file"
            onChange={handlePhotoChange}
          />
          <label htmlFor="photo-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              sx={{ mb: 2 }}
            >
              Upload New Photos
            </Button>
          </label>

          {/* Display existing photos */}
          {existingPhotos.length > 0 && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Existing Photos:
              </Typography>
              <ImageList cols={3} rowHeight={200}>
                {existingPhotos.map((photo) => (
                  <ImageListItem key={photo.id}>
                    <img 
                      src={getPublicUrl(photo.photo_path)} 
                      alt={photo.photo_name || `Photo ${photo.id}`} 
                      loading="lazy"
                      onError={(e) => {
                        console.error('Error loading photo:', photo.photo_path);
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                    <ImageListItemBar
                      title={photo.is_primary ? 'Primary Photo' : photo.photo_name || `Photo ${photo.id}`}
                      subtitle={photo.is_primary ? 'Main photo' : ''}
                      actionIcon={
                        <IconButton
                          sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                          onClick={() => removeExistingPhoto(photo.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {/* Display new photo previews */}
          {photoPreviews.length > 0 && (
            <Box sx={{ mt: existingPhotos.length > 0 ? 2 : 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                New Photos to Upload:
              </Typography>
              <ImageList cols={3} rowHeight={200}>
                {photoPreviews.map((preview, index) => (
                  <ImageListItem key={`new-${index}`}>
                    <img src={preview} alt={`Preview ${index + 1}`} loading="lazy" />
                    <ImageListItemBar
                      title={`New Photo ${index + 1}`}
                      actionIcon={
                        <IconButton
                          sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                          onClick={() => removePhoto(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {existingPhotos.length === 0 && photoPreviews.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No photos uploaded yet. Click "Upload New Photos" to add photos.
            </Typography>
          )}
        </Box>
      </FormSection>

      {/* Additional Information */}
      <FormSection title="Additional Information" subtitle="Any additional notes or specifications" columns={1}>
        <FormField
          name="description"
          label="Description"
          placeholder="Write a detailed description of the asset here"
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={4}
        />

        <FormField
          name="specifications"
          label="Specifications"
          placeholder="Enter technical specifications or additional details here"
          value={formData.specifications}
          onChange={handleChange}
          multiline
          rows={4}
        />
      </FormSection>
    </FormContainer>
  );
};

export default AssetForm;

