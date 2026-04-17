import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid as MuiGrid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Chip,
  Divider,
  OutlinedInput,
  SelectChangeEvent,
  Alert,
  Snackbar,
  GridProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Employee, apiService, API_BASE_URL } from '../../services/api';

// Create a Grid component that always includes component="div" for Grid items
const Grid = (props: GridProps & {
  item?: boolean;
  xs?: number | boolean;
  md?: number | boolean;
}) => {
  if (props.item) {
    return <MuiGrid component="div" {...props} />;
  }
  return <MuiGrid {...props} />;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stepValidation, setStepValidation] = useState({
    personal: false,
    official: false,
    bank: false,
    documents: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });
  const [employee, setEmployee] = useState<Employee>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    mobile: '',
    email: '',
    workEmail: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gender: '' as any,
    manpowerTypeId: 0,
    departmentId: 0,
    designationId: 0,
    workLocationId: 0,
    shiftId: 0,
    customerId: 0,
    customerCode: '',
    projectId: 0,
    projectCode: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    bankId: 0,
    accountNumber: '',
    paymentModeId: 0,
    qualificationIds: [],
    isActive: true,
  });

  // Master data
  const [manpowerTypes, setManpowerTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [masterDataLoading, setMasterDataLoading] = useState(false);

  // Document upload state
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [documentReference, setDocumentReference] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  // Staged documents for new employee creation (before employee is saved)
  const [stagedDocuments, setStagedDocuments] = useState<Array<{
    file: File;
    documentTypeId: string;
    documentTypeName: string;
    reference: string;
    preview?: string;
  }>>([]);

  // Profile picture state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Debug: Log when upload button state changes
  useEffect(() => {
    const isDisabled = !selectedFile || !documentTypeId || uploading;
    console.log('🔘 Upload button state:', {
      selectedFile: selectedFile?.name || 'none',
      documentTypeId: documentTypeId || 'none',
      uploading,
      isDisabled
    });
  }, [selectedFile, documentTypeId, uploading]);

  // Define loadEmployeeDocuments first so it can be used in loadEmployee
  const loadEmployeeDocuments = useCallback(async (employeeId: number) => {
    try {
      const response = await apiService.getEmployeeDocuments(employeeId);
      console.log('📄 Employee documents response:', response);
      if (response.success && response.data) {
        console.log('📄 Uploaded documents:', response.data);
        setUploadedDocuments(response.data);
      } else {
        console.log('📄 No documents found or response not successful');
        setUploadedDocuments([]);
      }
    } catch (error) {
      console.error('Error loading employee documents:', error);
      setUploadedDocuments([]);
    }
  }, []);

  const loadEmployee = useCallback(async (employeeId: number) => {
    try {
      const response = await apiService.getEmployeeById(employeeId);
      console.log('🔍 API Response:', response);
      if (response.success) {
        const employeeData = response.data;
        console.log('📋 Loaded employee data:', employeeData);
        console.log('📚 Qualification IDs from API:', employeeData.qualificationIds);
        console.log('📚 Type of qualificationIds:', typeof employeeData.qualificationIds);
        console.log('📚 Is Array?:', Array.isArray(employeeData.qualificationIds));

        setEmployee(employeeData);
        console.log('✅ Employee state updated');

        // Set photo preview if employee has an existing photo
        // Need to prepend the backend URL for the preview to work
        if (employeeData.photoPath && typeof employeeData.photoPath === 'string') {
          setPhotoPreview(`${API_BASE_URL}${employeeData.photoPath}`);
          console.log('📸 Photo preview set:', `${API_BASE_URL}${employeeData.photoPath}`);
        }
      }

      // Load uploaded documents
      await loadEmployeeDocuments(employeeId);
    } catch (error) {
      console.error('❌ Error loading employee data:', error);
    }
  }, [loadEmployeeDocuments]);

  const loadMasterData = useCallback(async () => {
    try {
      setMasterDataLoading(true);
      const [
        manpowerTypesRes,
        departmentsRes,
        designationsRes,
        shiftsRes,
        workLocationsRes,
        banksRes,
        paymentModesRes,
        qualificationsRes,
        documentTypesRes,
        customersRes,
        projectsRes
      ] = await Promise.all([
        apiService.getManpowerTypes(),
        apiService.getDepartments(),
        apiService.getDesignations(),
        apiService.getShifts(),
        apiService.getWorkLocations(),
        apiService.getBanks(),
        apiService.getPaymentModes(),
        apiService.getQualifications(),
        apiService.getDocumentTypes(),
        apiService.getCustomers(),
        apiService.getProjects()
      ]);

      // Check for any failed responses
      const failedResponses = [];
      if (!manpowerTypesRes.success) failedResponses.push('Manpower Types');
      if (!departmentsRes.success) failedResponses.push('Departments');
      if (!designationsRes.success) failedResponses.push('Designations');
      if (!shiftsRes.success) failedResponses.push('Shifts');
      if (!workLocationsRes.success) failedResponses.push('Work Locations');
      if (!banksRes.success) failedResponses.push('Banks');
      if (!paymentModesRes.success) failedResponses.push('Payment Modes');
      if (!qualificationsRes.success) failedResponses.push('Qualifications');
      if (!documentTypesRes.success) failedResponses.push('Document Types');
      if (!customersRes.success) failedResponses.push('Customers');
      if (!projectsRes.success) failedResponses.push('Projects');

      // Set data even if some responses failed
      setManpowerTypes(manpowerTypesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setDesignations(designationsRes.data || []);
      setShifts(shiftsRes.data || []);
      setWorkLocations(workLocationsRes.data || []);
      setBanks(banksRes.data || []);
      setPaymentModes(paymentModesRes.data || []);
      setQualifications(qualificationsRes.data || []);
      console.log('📚 Loaded qualifications:', qualificationsRes.data);
      setDocumentTypes(documentTypesRes.data || []);
      console.log('📄 Loaded document types:', documentTypesRes.data);
      setCustomers(customersRes.data || []);
      console.log('🏢 Loaded customers:', customersRes.data);
      setProjects(projectsRes.data || []);
      console.log('📁 Loaded projects:', projectsRes.data);

      // Show warning if some data failed to load
      if (failedResponses.length > 0) {
        setSnackbar({
          open: true,
          message: `Some data failed to load: ${failedResponses.join(', ')}. You may continue, but some options might be limited.`,
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error loading master data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load master data. Please refresh the page or try again later.',
        severity: 'error'
      });

      // Set fallback data for critical fields to ensure form is usable
      if (manpowerTypes.length === 0) {
        setManpowerTypes([
          { id: 1, name: 'Permanent', description: 'Permanent employees', isActive: true },
          { id: 2, name: 'Contract', description: 'Contract employees', isActive: true },
        ]);
      }
    } finally {
      setMasterDataLoading(false);
    }
  }, [manpowerTypes.length]);

  useEffect(() => {
    loadMasterData();
    if (isEdit && id) {
      loadEmployee(parseInt(id));
    }
  }, [isEdit, id, loadMasterData, loadEmployee]);

  const handleInputChange = (field: keyof Employee) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<any>
  ) => {
    const value = event.target.value;
    setEmployee(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDepartmentChange = (event: SelectChangeEvent<any>) => {
    const departmentId = parseInt(event.target.value as string, 10);
    setEmployee(prev => ({
      ...prev,
      departmentId: departmentId,
      designationId: 0 // Reset designation when department changes
    }));
  };

  const handleCustomerChange = (event: SelectChangeEvent<any>) => {
    const customerId = parseInt(event.target.value as string, 10);
    const customer = customers.find(c => c.id === customerId);
    setEmployee(prev => ({
      ...prev,
      customerId: customerId,
      customerCode: customer?.code || ''
    }));
  };

  const handleProjectChange = (event: SelectChangeEvent<any>) => {
    const projectId = parseInt(event.target.value as string, 10);
    const project = projects.find(p => p.id === projectId);
    setEmployee(prev => ({
      ...prev,
      projectId: projectId,
      projectCode: project?.code || ''
    }));
  };

  const handleQualificationChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setEmployee(prev => ({
      ...prev,
      qualificationIds: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📎 File selected:', file?.name);
    console.log('📎 Current documentTypeId:', documentTypeId);
    if (file) {
      // Get selected document type to validate against its allowed extensions and size
      // Use == to handle potential string/number mismatch from Select value
      const selectedDocType = documentTypes.find(dt => dt.id == documentTypeId);
      if (!selectedDocType) {
        console.log('❌ No document type selected!');
        setUploadError('Please select a document type first');
        return;
      }

      // Validate file extension
      const allowedExtensions = (selectedDocType.allowedExtensions || 'pdf,jpg,jpeg,png')
        .split(',')
        .map((ext: string) => ext.trim().toLowerCase());
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        setUploadError(`Invalid file type. Allowed formats: ${allowedExtensions.join(', ').toUpperCase()}`);
        return;
      }

      // Validate file size
      const maxSizeMB = selectedDocType.maxFileSizeMb || 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setUploadError(`File size should be less than ${maxSizeMB}MB`);
        return;
      }

      setSelectedFile(file);
      setUploadError('');

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message: 'Please select a valid image file (JPEG, PNG, JPG)',
          severity: 'error'
        });
        return;
      }

      // Validate file size (max 2MB for profile pictures)
      if (file.size > 2 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Profile picture size should be less than 2MB',
          severity: 'error'
        });
        return;
      }

      setSelectedPhoto(file);
      setEmployee(prev => ({
        ...prev,
        photoPath: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocumentToStage = () => {
    console.log('🔵 handleAddDocumentToStage called!');
    console.log('🔵 selectedFile:', selectedFile);
    console.log('🔵 documentTypeId:', documentTypeId);

    if (!selectedFile || !documentTypeId) {
      console.log('❌ Validation failed: missing file or document type');
      setUploadError('Please select a file and document type');
      return;
    }

    // Get document type name
    // Use == to handle potential string/number mismatch from Select value
    const docType = documentTypes.find(dt => dt.id == documentTypeId);
    if (!docType) {
      setUploadError('Invalid document type selected');
      return;
    }

    // Check if this document type is already staged
    // Use == to handle potential string/number mismatch from Select value
    const existingDoc = stagedDocuments.find(doc => doc.documentTypeId == documentTypeId);
    if (existingDoc) {
      setUploadError(`A document of type "${docType.name}" is already added. Please remove it first if you want to replace it.`);
      return;
    }

    // Add to staged documents
    const newStagedDoc = {
      file: selectedFile,
      documentTypeId: documentTypeId,
      documentTypeName: docType.name,
      reference: documentReference,
      preview: filePreview || undefined
    };

    setStagedDocuments([...stagedDocuments, newStagedDoc]);
    setUploadSuccess(`Document "${docType.name}" added successfully. It will be uploaded when you save the employee.`);

    // Clear the form
    setSelectedFile(null);
    setFilePreview(null);
    setDocumentTypeId('');
    setDocumentReference('');
    setUploadError('');

    console.log('✅ Document staged successfully:', newStagedDoc);
  };

  const handleRemoveStagedDocument = (documentTypeId: string) => {
    setStagedDocuments(stagedDocuments.filter(doc => doc.documentTypeId !== documentTypeId));
    setUploadSuccess('Document removed from staging');
  };

  const handleUploadDocument = async () => {
    console.log('🔵 handleUploadDocument called!');
    console.log('🔵 selectedFile:', selectedFile);
    console.log('🔵 documentTypeId:', documentTypeId);
    console.log('🔵 id:', id);

    if (!selectedFile || !documentTypeId) {
      console.log('❌ Validation failed: missing file or document type');
      setUploadError('Please select a file and document type');
      return;
    }

    if (!id) {
      console.log('❌ Validation failed: no employee ID');
      setUploadError('Please save the employee first before uploading documents');
      return;
    }

    console.log('✅ Validation passed, starting upload...');
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentTypeId', documentTypeId);
      formData.append('reference', documentReference);
      formData.append('employeeId', id);

      console.log('📤 Uploading document for employee:', id);
      console.log('📤 FormData contents:', {
        file: selectedFile.name,
        documentTypeId,
        reference: documentReference,
        employeeId: id
      });

      const response = await apiService.uploadEmployeeDocument(formData);
      console.log('📤 Upload response:', response);

      // Fix: response is already unwrapped by apiService, so check response.success not response.data.success
      if (response.success) {
        console.log('✅ Upload successful!');
        setUploadSuccess('Document uploaded successfully');
        setSelectedFile(null);
        setFilePreview(null);
        setDocumentTypeId('');
        setDocumentReference('');

        // Reload documents list
        console.log('📤 Reloading documents...');
        await loadEmployeeDocuments(parseInt(id));
      } else {
        console.log('❌ Upload failed:', response.message);
        setUploadError(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      setUploadError(error?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      console.log('🔵 Upload process completed');
    }
  };

  const uploadStagedDocuments = async (employeeId: number) => {
    console.log('📤 Uploading staged documents for employee:', employeeId);
    console.log('📤 Staged documents count:', stagedDocuments.length);

    if (stagedDocuments.length === 0) {
      console.log('📤 No staged documents to upload');
      return { success: true, uploadedCount: 0 };
    }

    let uploadedCount = 0;
    const errors: string[] = [];

    for (const doc of stagedDocuments) {
      try {
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('documentTypeId', doc.documentTypeId);
        formData.append('reference', doc.reference);
        formData.append('employeeId', employeeId.toString());

        console.log('📤 Uploading document:', doc.documentTypeName);
        const response = await apiService.uploadEmployeeDocument(formData);

        if (response.success) {
          uploadedCount++;
          console.log('✅ Document uploaded:', doc.documentTypeName);
        } else {
          errors.push(`Failed to upload ${doc.documentTypeName}: ${response.message}`);
          console.error('❌ Upload failed:', doc.documentTypeName, response.message);
        }
      } catch (error: any) {
        errors.push(`Failed to upload ${doc.documentTypeName}: ${error?.response?.data?.message || 'Unknown error'}`);
        console.error('❌ Upload error:', doc.documentTypeName, error);
      }
    }

    console.log('📤 Upload complete. Uploaded:', uploadedCount, 'Errors:', errors.length);
    return { success: errors.length === 0, uploadedCount, errors };
  };

  const handleViewDocument = (filePath: string) => {
    const fileUrl = `${API_BASE_URL}${filePath}`;
    window.open(fileUrl, '_blank');
  };

  const handleDownloadDocument = (filePath: string, fileName: string) => {
    const fileUrl = `${API_BASE_URL}${filePath}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await apiService.deleteEmployeeDocument(documentId);
      if (response.success) {
        setUploadSuccess('Document deleted successfully');
        // Reload documents list
        if (id) {
          await loadEmployeeDocuments(parseInt(id));
        }
      } else {
        setUploadError(response.message || 'Delete failed');
      }
    } catch (error: any) {
      setUploadError(error?.response?.data?.message || 'Delete failed');
    }
  };

  const validatePersonalStep = () => {
    const errors: string[] = [];
    if (!employee.firstName?.trim()) errors.push('First Name is required');
    if (!employee.lastName?.trim()) errors.push('Last Name is required');
    if (!employee.email?.trim()) errors.push('Email is required');
    if (!employee.mobile?.trim()) errors.push('Mobile number is required');
    if (!employee.dateOfBirth) errors.push('Date of Birth is required');
    if (!employee.gender) errors.push('Gender is required');
    if (!employee.address?.trim()) errors.push('Address is required');
    if (!employee.city?.trim()) errors.push('City is required');
    if (!employee.state?.trim()) errors.push('State is required');
    if (!employee.pincode?.trim()) errors.push('Pincode is required');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (employee.email && !emailRegex.test(employee.email)) {
      errors.push('Please enter a valid email address');
    }
    if (employee.workEmail && !emailRegex.test(employee.workEmail)) {
      errors.push('Please enter a valid work email address');
    }
    const mobileRegex = /^[0-9]{10,15}$/;
    if (employee.mobile && !mobileRegex.test(employee.mobile)) {
      errors.push('Please enter a valid mobile number (10-15 digits)');
    }
    return errors;
  };

  const validateOfficialStep = () => {
    const errors: string[] = [];
    if (!employee.manpowerTypeId) errors.push('Manpower Type is required');
    if (!employee.departmentId) errors.push('Department is required');
    if (!employee.designationId || employee.designationId === 0) errors.push('Designation is required');
    if (!employee.joiningDate) errors.push('Joining Date is required');
    if (!employee.workLocationId) errors.push('Work Location is required');
    if (!employee.shiftId) errors.push('Shift is required');
    return errors;
  };

  const validateBankStep = () => {
    const errors: string[] = [];
    if (employee.accountNumber && employee.accountNumber.trim()) {
      if (!employee.bankId) {
        errors.push('Bank is required when account number is provided');
      }
      if (!employee.paymentModeId) {
        errors.push('Payment Mode is required when account number is provided');
      }
      const accountRegex = /^[0-9]{9,18}$/;
      if (!accountRegex.test(employee.accountNumber)) {
        errors.push('Account number should be 9-18 digits');
      }
    }
    return errors;
  };

  const validateForm = () => {
    const personalErrors = validatePersonalStep();
    const officialErrors = validateOfficialStep();
    const bankErrors = validateBankStep();
    return [...personalErrors, ...officialErrors, ...bankErrors];
  };

  const validateCurrentStep = (step: number) => {
    switch (step) {
      case 0: return validatePersonalStep();
      case 1: return validateOfficialStep();
      case 2: return validateBankStep();
      default: return [];
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue < activeTab) {
      setActiveTab(newValue);
      return;
    }
    const currentStepErrors = validateCurrentStep(activeTab);
    if (currentStepErrors.length > 0 && newValue > activeTab) {
      setSnackbar({
        open: true,
        message: 'Please fix the following errors before proceeding:\n' + currentStepErrors.join('\n'),
        severity: 'warning'
      });
      return;
    }
    const newStepValidation = { ...stepValidation };
    switch (activeTab) {
      case 0: newStepValidation.personal = currentStepErrors.length === 0; break;
      case 1: newStepValidation.official = currentStepErrors.length === 0; break;
      case 2: newStepValidation.bank = currentStepErrors.length === 0; break;
      case 3: newStepValidation.documents = true; break;
    }
    setStepValidation(newStepValidation);
    setActiveTab(newValue);
  };

  const validateMasterDataExists = () => {
    const errors: string[] = [];

    // Check if master data is loaded
    if (manpowerTypes.length === 0) {
      errors.push('Master data is still loading. Please wait and try again.');
      return errors;
    }

    // Validate required foreign keys
    if (!employee.manpowerTypeId || employee.manpowerTypeId === 0) {
      errors.push('Manpower Type is required and must be selected.');
    } else if (!manpowerTypes.find(mt => mt.id === employee.manpowerTypeId)) {
      errors.push('Selected Manpower Type does not exist. Please refresh the page and try again.');
    }

    if (!employee.departmentId || employee.departmentId === 0) {
      errors.push('Department is required and must be selected.');
    } else if (!departments.find(d => d.id === employee.departmentId)) {
      errors.push('Selected Department does not exist. Please refresh the page and try again.');
    }

    if (!employee.designationId || employee.designationId === 0) {
      errors.push('Designation is required and must be selected.');
    } else if (!designations.find(d => d.id === employee.designationId)) {
      errors.push('Selected Designation does not exist. Please refresh the page and try again.');
    }

    if (!employee.workLocationId || employee.workLocationId === 0) {
      errors.push('Work Location is required and must be selected.');
    } else if (!workLocations.find(wl => wl.id === employee.workLocationId)) {
      errors.push('Selected Work Location does not exist. Please refresh the page and try again.');
    }

    if (!employee.shiftId || employee.shiftId === 0) {
      errors.push('Shift is required and must be selected.');
    } else if (!shifts.find(s => s.id === employee.shiftId)) {
      errors.push('Selected Shift does not exist. Please refresh the page and try again.');
    }

    // Validate optional foreign keys only if they have values
    if (employee.bankId && employee.bankId !== 0 && !banks.find(b => b.id === employee.bankId)) {
      errors.push('Selected Bank does not exist. Please refresh the page and try again.');
    }

    if (employee.paymentModeId && employee.paymentModeId !== 0 && !paymentModes.find(pm => pm.id === employee.paymentModeId)) {
      errors.push('Selected Payment Mode does not exist. Please refresh the page and try again.');
    }

    if (employee.qualificationIds && employee.qualificationIds.length > 0) {
      employee.qualificationIds.forEach(qId => {
        if (qId !== 0 && !qualifications.find(q => q.id === qId)) {
          errors.push(`Selected Qualification (ID: ${qId}) does not exist. Please refresh the page and try again.`);
        }
      });
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateForm();
    const masterDataErrors = validateMasterDataExists();

    const allErrors = [...validationErrors, ...masterDataErrors];

    if (allErrors.length > 0) {
      setSnackbar({
        open: true,
        message: 'Please fix the following errors:\n' + allErrors.join('\n'),
        severity: 'error'
      });
      return;
    }

    console.log('=== FRONTEND EMPLOYEE SUBMIT START ===');
    console.log('Employee data to submit:', JSON.stringify(employee, null, 2));
    console.log('Is edit mode:', isEdit);
    console.log('Employee ID:', id);

    try {
      setLoading(true);
      let newEmployeeId: number | null = null;

      if (isEdit && id) {
        console.log('=== UPDATING EMPLOYEE ===');
        // Use updateEmployeeWithPhoto if photoPath is present and is a File object
        if (employee.photoPath && typeof employee.photoPath !== 'string') {
          console.log('Using updateEmployeeWithPhoto with file');
          await apiService.updateEmployeeWithPhoto(parseInt(id), employee, employee.photoPath as File);
        } else {
          console.log('Using updateEmployee without photo');
          await apiService.updateEmployee(parseInt(id), employee);
        }
        setSnackbar({ open: true, message: 'Employee updated successfully!', severity: 'success' });
      } else {
        console.log('=== CREATING EMPLOYEE ===');
        // Use createEmployeeWithPhoto if photoPath is present and is a File object
        let response;
        if (employee.photoPath && typeof employee.photoPath !== 'string') {
          console.log('Using createEmployeeWithPhoto with file');
          response = await apiService.createEmployeeWithPhoto(employee, employee.photoPath as File);
        } else {
          console.log('Using createEmployee without photo');
          response = await apiService.createEmployee(employee);
        }

        console.log('📋 Create employee response:', response);

        // Extract the new employee ID from the response
        // The response structure is { success: true, message: '...', id: number }
        if (response && response.id) {
          newEmployeeId = response.id;
          console.log('✅ Employee created with ID:', newEmployeeId);
        } else if (response && response.data && response.data.id) {
          newEmployeeId = response.data.id;
          console.log('✅ Employee created with ID (from data):', newEmployeeId);
        }

        // Upload staged documents if any
        if (stagedDocuments.length > 0 && newEmployeeId) {
          console.log('📤 Uploading staged documents...');
          const uploadResult = await uploadStagedDocuments(newEmployeeId);

          if (uploadResult.success) {
            setSnackbar({
              open: true,
              message: `Employee created successfully! ${uploadResult.uploadedCount} document(s) uploaded.`,
              severity: 'success'
            });
            // Clear staged documents after successful upload
            setStagedDocuments([]);
          } else {
            const errorMessages = uploadResult.errors && uploadResult.errors.length > 0
              ? uploadResult.errors.join('\n')
              : 'Unknown error occurred';
            setSnackbar({
              open: true,
              message: `Employee created successfully! However, some documents failed to upload:\n${errorMessages}`,
              severity: 'warning'
            });
          }
        } else {
          setSnackbar({ open: true, message: 'Employee created successfully!', severity: 'success' });
        }
      }
      setTimeout(() => navigate('/employees'), 1500);
    } catch (error: any) {
      console.error('=== FRONTEND ERROR ===');
      console.error('Error saving employee:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      console.error('Error response status:', error?.response?.status);
      const errorMessage = error?.response?.data?.message || 'Error saving employee. Please try again.';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  const getFilteredDesignations = () => {
    if (!employee.departmentId) return [];
    return designations.filter(d => d.departmentId === employee.departmentId);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isEdit ? 'Edit Employee' : 'Add New Employee'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill out the employee information across the tabs below. You can navigate back to previous tabs anytime,
        but forward navigation requires completing the current step.
      </Typography>
      <Paper elevation={2}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Personal Information" />
          <Tab label="Official Information" />
          <Tab label="Bank & Payment" />
          <Tab label="Documents & Qualifications" />
        </Tabs>
        <form onSubmit={handleSubmit}>
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Profile Picture Section */}
              <Grid component="div" item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={photoPreview || (typeof employee.photoPath === 'string' && employee.photoPath ? `${process.env.REACT_APP_API_URL || 'http://localhost:3004'}${employee.photoPath}` : undefined)}
                      sx={{ width: 120, height: 120, border: '3px solid #e0e0e0' }}
                    >
                      {!photoPreview && !employee.photoPath && (
                        <Typography variant="h4" color="text.secondary">
                          {employee.firstName?.charAt(0) || '?'}
                        </Typography>
                      )}
                    </Avatar>
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': { backgroundColor: 'primary.dark' }
                      }}
                    >
                      <PhotoCameraIcon />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handlePhotoSelect}
                      />
                    </IconButton>
                  </Box>
                  <Box>
                    <Typography variant="h6" gutterBottom>Profile Picture</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload a clear photo of the employee. Supported formats: JPEG, PNG, JPG. Max size: 2MB.
                    </Typography>
                    {selectedPhoto && (
                      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                        Selected: {selectedPhoto.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid component="div" item xs={12} md={4}>
                <TextField fullWidth label="First Name" required value={employee.firstName} onChange={handleInputChange('firstName')} />
              </Grid>
              <Grid component="div" item xs={12} md={4}>
                <TextField fullWidth label="Middle Name" value={employee.middleName || ''} onChange={handleInputChange('middleName')} />
              </Grid>
              <Grid component="div" item xs={12} md={4}>
                <TextField fullWidth label="Last Name" required value={employee.lastName} onChange={handleInputChange('lastName')} />
              </Grid>
              <Grid component="div" item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel id="gender-label" shrink={!!employee.gender || true}>Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    value={employee.gender || ''}
                    label="Gender"
                    onChange={handleInputChange('gender')}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined) {
                        return <span style={{
                          color: 'rgba(0, 0, 0, 0.6)',
                          fontSize: '0.875rem',
                          display: 'inline-block',
                          overflow: 'visible',
                          textOverflow: 'clip',
                          whiteSpace: 'nowrap',
                          width: '100%'
                        }}>Select Gender</span>;
                      }
                      return <span style={{
                        color: 'rgba(0, 0, 0, 0.87)',
                        fontSize: '0.875rem',
                        display: 'inline-block',
                        overflow: 'visible',
                        textOverflow: 'clip',
                        whiteSpace: 'nowrap'
                      }}>{selected === 'MALE' ? 'Male' : selected === 'FEMALE' ? 'Female' : 'Other'}</span>;
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
                        boxSizing: 'border-box !important',
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
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Date of Birth" type="date" required value={employee.dateOfBirth} onChange={handleInputChange('dateOfBirth')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Mobile Number" required value={employee.mobile} onChange={handleInputChange('mobile')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" type="email" value={employee.email || ''} onChange={handleInputChange('email')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Work Email" type="email" value={employee.workEmail || ''} onChange={handleInputChange('workEmail')} />
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField fullWidth label="Address" multiline rows={2} value={employee.address || ''} onChange={handleInputChange('address')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="City" value={employee.city || ''} onChange={handleInputChange('city')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="State" value={employee.state || ''} onChange={handleInputChange('state')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Pincode" value={employee.pincode || ''} onChange={handleInputChange('pincode')} />
              </Grid>

              {/* Enhanced Profile Fields */}
              <Grid item xs={12} md={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Profile Information</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Alternate Number" value={employee.alternateNumber || ''} onChange={handleInputChange('alternateNumber')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Marital Status</InputLabel>
                  <Select
                    value={employee.maritalStatus || 'SINGLE'}
                    label="Marital Status"
                    onChange={handleInputChange('maritalStatus')}
                  >
                    <MenuItem value="SINGLE">Single</MenuItem>
                    <MenuItem value="MARRIED">Married</MenuItem>
                    <MenuItem value="DIVORCED">Divorced</MenuItem>
                    <MenuItem value="WIDOWED">Widowed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Blood Group" value={employee.bloodGroup || ''} onChange={handleInputChange('bloodGroup')} />
              </Grid>

              <Grid item xs={12} md={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Emergency Contact</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Emergency Contact Name" value={employee.emergencyContactName || ''} onChange={handleInputChange('emergencyContactName')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Emergency Contact Number" value={employee.emergencyContactNumber || ''} onChange={handleInputChange('emergencyContactNumber')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Relationship" value={employee.emergencyContactRelation || ''} onChange={handleInputChange('emergencyContactRelation')} />
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Manpower Type</InputLabel>
                  <Select
                    value={employee.manpowerTypeId ?? ''}
                    label="Manpower Type"
                    onChange={handleInputChange('manpowerTypeId')}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Manpower Type</span>;
                      }
                      const type = manpowerTypes.find(t => t.id === selected);
                      return type?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {manpowerTypes.map((type) => (<MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={employee.departmentId ?? ''}
                    label="Department"
                    onChange={handleDepartmentChange}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Department</span>;
                      }
                      const dept = departments.find(d => d.id === selected);
                      return dept?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {departments.map((dept) => (<MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Designation</InputLabel>
                  <Select
                    value={employee.designationId ?? ''}
                    label="Designation"
                    onChange={handleInputChange('designationId')}
                    disabled={!employee.departmentId || masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Designation</span>;
                      }
                      const designation = getFilteredDesignations().find(d => d.id === selected);
                      return designation?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {getFilteredDesignations().map((designation) => (<MenuItem key={designation.id} value={designation.id}>{designation.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Joining Date" type="date" required value={employee.joiningDate} onChange={handleInputChange('joiningDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Work Location</InputLabel>
                  <Select
                    value={employee.workLocationId ?? ''}
                    label="Work Location"
                    onChange={handleInputChange('workLocationId')}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Work Location</span>;
                      }
                      const location = workLocations.find(l => l.id === selected);
                      return location?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {workLocations.map((location) => (<MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Shift</InputLabel>
                  <Select
                    value={employee.shiftId ?? ''}
                    label="Shift"
                    onChange={handleInputChange('shiftId')}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Shift</span>;
                      }
                      const shift = shifts.find(s => s.id === selected);
                      return shift?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {shifts.map((shift) => (<MenuItem key={shift.id} value={shift.id}>{shift.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={employee.customerId ?? ''}
                    label="Customer"
                    onChange={handleCustomerChange}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Customer</span>;
                      }
                      const customer = customers.find(c => c.id === selected);
                      return customer?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {customers.filter(c => (c.isActive || c.id === employee.customerId)).map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Code"
                  value={employee.customerCode || ''}
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={employee.projectId ?? ''}
                    label="Project"
                    onChange={handleProjectChange}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Project</span>;
                      }
                      const project = projects.find(p => p.id === selected);
                      return project?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {projects.filter(p => (p.isActive || p.id === employee.projectId)).map((project) => (
                      <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Code"
                  value={employee.projectCode || ''}
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={employee.status || 'ACTIVE'}
                    label="Status"
                    onChange={handleInputChange('status')}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Status</span>;
                      }
                      return selected === 'ACTIVE' ? 'Active' : selected === 'INACTIVE' ? 'Inactive' : selected === 'TERMINATED' ? 'Terminated' : 'Resigned';
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="TERMINATED">Terminated</MenuItem>
                    <MenuItem value="RESIGNED">Resigned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Bank</InputLabel>
                  <Select
                    value={employee.bankId ?? ''}
                    label="Bank"
                    onChange={handleInputChange('bankId')}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Bank</span>;
                      }
                      const bank = banks.find(b => b.id === selected);
                      return bank?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {banks.map((bank) => (<MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Account Number" value={employee.accountNumber || ''} onChange={handleInputChange('accountNumber')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    value={employee.paymentModeId ?? ''}
                    label="Payment Mode"
                    onChange={handleInputChange('paymentModeId')}
                    disabled={masterDataLoading}
                    displayEmpty
                    renderValue={(selected: any) => {
                      if (!selected || selected === '' || selected === null || selected === undefined || selected === 0) {
                        return <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>Select Payment Mode</span>;
                      }
                      const mode = paymentModes.find(m => m.id === selected);
                      return mode?.name || String(selected);
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
                        '@media (max-width:600px)': {
                          paddingLeft: '16px !important',
                          paddingRight: '32px !important',
                          paddingTop: '10px !important',
                          paddingBottom: '10px !important',
                        },
                      },
                    }}
                  >
                    {paymentModes.map((mode) => (<MenuItem key={mode.id} value={mode.id}>{mode.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Qualifications</Typography>


                <FormControl fullWidth>
                  <InputLabel id="qualifications-label">Select Qualifications</InputLabel>
                  <Select
                    labelId="qualifications-label"
                    multiple
                    value={employee.qualificationIds ?? []}
                    onChange={handleQualificationChange}
                    input={<OutlinedInput label="Select Qualifications" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => {
                          const qual = qualifications.find(q => q.id === value);
                          return (
                            <Chip
                              key={value}
                              label={qual?.name || `ID: ${value}`}
                              size="small"
                              sx={{ backgroundColor: '#2196f3', color: 'white' }}
                            />
                          );
                        })}
                      </Box>
                    )}
                    disabled={masterDataLoading}
                  >
                    {qualifications.map((qualification) => (
                      <MenuItem key={qualification.id} value={qualification.id}>
                        <Checkbox checked={(employee.qualificationIds || []).indexOf(qualification.id) > -1} />
                        {qualification.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid sx={{ mt: 3 }} item xs={12}>
                <Typography variant="h6" gutterBottom>Documents</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Upload employee documents (Aadhar, PAN, etc.).</Typography>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, backgroundColor: '#f9f9f9' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Document Type</InputLabel>
                        <Select
                          value={documentTypeId}
                          label="Document Type"
                          onChange={e => {
                            console.log('📄 Document type selected:', e.target.value);
                            console.log('📄 Available document types:', documentTypes);
                            setDocumentTypeId(e.target.value);
                          }}
                        >
                          {documentTypes.map((type: any) => (
                            <MenuItem key={type.id} value={type.id}>
                              <Box>
                                <Typography variant="body1">{type.name}</Typography>
                                {type.is_mandatory && (
                                  <Typography variant="caption" color="error">* Required</Typography>
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField fullWidth label="Reference" value={documentReference} onChange={e => setDocumentReference(e.target.value)} placeholder="Enter reference" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button variant="outlined" component="label" fullWidth sx={{ py: 1.5 }}>
                        {selectedFile ? 'Change File' : 'Select File'}
                        <input type="file" hidden onChange={handleFileSelect} />
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      {isEdit ? (
                        <Button
                          type="button"
                          variant="contained"
                          color="primary"
                          disabled={!selectedFile || !documentTypeId || uploading}
                          onClick={handleUploadDocument}
                          fullWidth
                          sx={{ py: 1.5 }}
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="contained"
                          color="secondary"
                          disabled={!selectedFile || !documentTypeId}
                          onClick={handleAddDocumentToStage}
                          fullWidth
                          sx={{ py: 1.5 }}
                        >
                          Add Document
                        </Button>
                      )}
                    </Grid>
                  </Grid>

                  {/* File Preview */}
                  {selectedFile && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          {/* File Icon or Image Preview */}
                          {filePreview ? (
                            <Box
                              component="img"
                              src={filePreview}
                              alt="Preview"
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '2px solid #2196f3'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 80,
                                height: 80,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff',
                                borderRadius: 1,
                                border: '2px solid #2196f3'
                              }}
                            >
                              {selectedFile.type === 'application/pdf' ? (
                                <PdfIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
                              ) : selectedFile.type.startsWith('image/') ? (
                                <ImageIcon sx={{ fontSize: 40, color: '#2196f3' }} />
                              ) : (
                                <FileIcon sx={{ fontSize: 40, color: '#757575' }} />
                              )}
                            </Box>
                          )}

                          {/* File Details */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                              {selectedFile.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Type: {selectedFile.type || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Size: {(selectedFile.size / 1024).toFixed(2)} KB
                              {selectedFile.size > 1024 * 1024 && ` (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Remove Button */}
                        <IconButton
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                            setUploadError('');
                          }}
                          sx={{ color: '#d32f2f' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  )}

                  {/* Document Type Information Display */}
                  {documentTypeId && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      {(() => {
                        const selectedDocType = documentTypes.find(dt => dt.id === documentTypeId);
                        if (!selectedDocType) return null;

                        return (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                📄 Allowed Formats:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedDocType.allowedExtensions?.split(',').join(', ').toUpperCase() || 'PDF, JPG, JPEG, PNG'}
                              </Typography>
                            </Grid>
                            <Grid component="div" item xs={12} md={6}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                📏 Maximum Size:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedDocType.maxFileSizeMb || 5} MB
                              </Typography>
                            </Grid>
                            {selectedDocType.description && (
                              <Grid component="div" item xs={12}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  ℹ️ Description:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {selectedDocType.description}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        );
                      })()}
                    </Box>
                  )}

                  {uploadError ? (<Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>) : null}
                  {uploadSuccess ? (<Alert severity="success" sx={{ mt: 2 }}>{uploadSuccess}</Alert>) : null}

                  {/* Staged Documents List (for new employees) */}
                  {!isEdit && stagedDocuments.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        📋 Documents to Upload (will be uploaded when you save the employee)
                      </Typography>
                      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>Document Type</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>File Size</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stagedDocuments.map((doc, index) => (
                              <TableRow key={index} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {doc.file.type === 'application/pdf' ? (
                                      <PdfIcon sx={{ color: '#d32f2f' }} />
                                    ) : doc.file.type.startsWith('image/') ? (
                                      <ImageIcon sx={{ color: '#2196f3' }} />
                                    ) : (
                                      <FileIcon sx={{ color: '#757575' }} />
                                    )}
                                    <Typography variant="body2">{doc.documentTypeName}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{doc.file.name}</TableCell>
                                <TableCell>{doc.reference || '-'}</TableCell>
                                <TableCell>
                                  {(doc.file.size / 1024).toFixed(2)} KB
                                  {doc.file.size > 1024 * 1024 && ` (${(doc.file.size / (1024 * 1024)).toFixed(2)} MB)`}
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Remove Document">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveStagedDocument(doc.documentTypeId)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        These documents will be automatically uploaded when you click "Save Employee" button.
                      </Alert>
                    </Box>
                  )}

                  {/* Uploaded Documents List */}
                  {(() => {
                    console.log('📄 Rendering documents section - isEdit:', isEdit, 'uploadedDocuments.length:', uploadedDocuments.length, 'uploadedDocuments:', uploadedDocuments);
                    return null;
                  })()}
                  {isEdit && uploadedDocuments.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        📎 Uploaded Documents
                      </Typography>
                      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>Document Type</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Upload Date</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {uploadedDocuments.map((doc: any) => (
                              <TableRow key={doc.id} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {doc.filePath?.endsWith('.pdf') ? (
                                      <PdfIcon sx={{ color: '#d32f2f' }} />
                                    ) : doc.filePath?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                      <ImageIcon sx={{ color: '#2196f3' }} />
                                    ) : (
                                      <FileIcon sx={{ color: '#757575' }} />
                                    )}
                                    <Typography variant="body2">{doc.documentTypeName || 'Unknown'}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{doc.fileName || 'N/A'}</TableCell>
                                <TableCell>{doc.reference || '-'}</TableCell>
                                <TableCell>
                                  {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Tooltip title="View Document">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleViewDocument(doc.filePath)}
                                      >
                                        <VisibilityIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download Document">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => handleDownloadDocument(doc.filePath, doc.fileName)}
                                      >
                                        <DownloadIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Document">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteDocument(doc.id)}
                                      >
                                        <DeleteIcon />
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
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Employee' : 'Save Employee'}
            </Button>
          </Box>
        </form>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ whiteSpace: 'pre-line' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeForm;
