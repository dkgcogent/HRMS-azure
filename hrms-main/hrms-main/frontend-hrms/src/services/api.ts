import axios from 'axios';

// API Base URL
// API Base URL
const rawApiUrl = process.env.REACT_APP_API_URL;
// If same-origin ('/'), use '/api' as the base to hit the Vercel backend rewrite
export const API_BASE_URL = rawApiUrl === '/' ? '/api' : (rawApiUrl ? rawApiUrl.replace(/\/$/, '') : 'http://localhost:3004');

// Base URL for images
// We use the same base for images as for the API because all backend communication 
// must go through the /api rewrite on Vercel production.
export const IMAGE_BASE_URL = API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility function for standardized error handling
const handleApiError = (error: any, operation: string, emptyData: any = []) => {
  console.error(`Error in ${operation}:`, error);
  if (error.response) {
    return error.response.data;
  }
  return {
    success: false,
    message: error.message || `Failed to ${operation}`,
    data: emptyData
  };
};

// Retry mechanism for critical API calls
const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      retries++;
      console.warn(`API call failed, retry attempt ${retries}/${maxRetries}`);
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Create axios instance for file uploads
const apiUpload = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Request interceptor for api
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for apiUpload (file uploads)
apiUpload.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Response interceptor for apiUpload
apiUpload.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Employee interfaces
export interface Employee {
  id?: number;
  employeeId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  mobile: string;
  email?: string;
  workEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  photoPath?: string | File;
  manpowerTypeId: number;
  manpowerTypeName?: string;
  manpowerType?: { id: number; name: string; };
  departmentId: number;
  departmentName?: string;
  department?: { id: number; name: string; };
  designationId: number;
  designationName?: string;
  designation?: { id: number; name: string; };
  workLocationId?: number;
  workLocationName?: string;
  shiftId?: number;
  shiftName?: string;
  customerId?: number;
  customerName?: string;
  customerCode?: string;
  projectId?: number;
  projectName?: string;
  projectCode?: string;
  joiningDate: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'RESIGNED';
  bankId?: number;
  bankName?: string;
  accountNumber?: string;
  paymentModeId?: number;
  paymentModeName?: string;
  qualificationIds?: number[];
  qualificationNames?: string[];
  isActive?: boolean;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  personalEmail?: string;
  alternateNumber?: string;
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  bloodGroup?: string;
  salary?: number;
}

// Master data interfaces
export interface ManpowerType {
  id?: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Department {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface Designation {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  departmentId: number;
  departmentName?: string;
  level?: string;
  isActive?: boolean;
}

export interface Shift {
  id?: number;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  isActive?: boolean;
}

export interface WorkLocation {
  id?: number;
  name: string;
  code?: string;
  region?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive?: boolean;
}

export interface Bank {
  id?: number;
  name: string;
  ifscCode: string;
  branchName?: string;
  address?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}

export interface PaymentMode {
  id?: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Qualification {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  level?: 'SCHOOL' | 'DIPLOMA' | 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DOCTORATE' | 'PROFESSIONAL';
  isActive?: boolean;
}

export interface DocumentType {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  isMandatory?: boolean;
  allowedExtensions?: string;
  maxFileSizeMb?: number;
  isActive?: boolean;
}

export interface Customer {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface Project {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}


// Leave Management Interfaces
export interface LeaveType {
  id?: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface LeaveApplication {
  id?: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
}

// Expense Management Interfaces
export interface ExpenseCategory {
  id?: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface ExpenseRequest {
  id?: number;
  employeeId: number;
  expenseCategoryId: number;
  amount: number;
  description?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
}

// Payroll Management Interfaces
export interface SalaryComponent {
  id?: number;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  is_active?: boolean;
}

export interface EmployeeSalary {
  employee_id: number;
  salary_component_id: number;
  amount: number;
}

export interface Payslip {
  id?: number;
  employee_id: number;
  month: number;
  year: number;
  gross_salary: number;
  net_salary: number;
}

// Promotion Interfaces
export interface Promotion {
  id?: number;
  employee_id: number;
  from_designation: string;
  to_designation: string;
  from_department: string;
  to_department: string;
  from_salary: number;
  to_salary: number;
  promotion_date: string;
  effective_date: string;
  promotion_type: 'PROMOTION' | 'TRANSFER' | 'DESIGNATION_CHANGE' | 'SALARY_REVISION';
  reason: string;
  approved_by: string;
  approval_date: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IMPLEMENTED' | 'REJECTED';
  justification: string;
  performance_rating?: number;
  achievements?: string[];
  new_responsibilities?: string;
  training_required?: string;
  remarks?: string;
}

// Benefit Interfaces
export interface InsurancePolicy {
  id?: number;
  employee_id: number;
  policy_type: 'MEDICAL' | 'LIFE' | 'ACCIDENT' | 'DISABILITY';
  policy_number: string;
  insurance_provider: string;
  policy_name: string;
  coverage_amount: number;
  premium_amount: number;
  premium_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  is_company_provided: boolean;
  employee_contribution: number;
  company_contribution: number;
  deductible?: number;
  co_payment?: number;
  remarks?: string;
}

export interface InsuranceClaim {
  id?: number;
  policy_id: number;
  claim_number: string;
  claim_date: string;
  claim_amount: number;
  approved_amount?: number;
  claim_type: string;
  description: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';
  submitted_date: string;
  settlement_date?: string;
  remarks?: string;
}

export interface GratuityRecord {
  id?: number;
  employee_id: number;
  joining_date: string;
  current_salary: number;
  service_years: number;
  eligible_amount: number;
  calculation_method: string;
  last_calculation_date: string;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PAID';
}

// Notification Interfaces
export interface NotificationTemplate {
  id?: number;
  name: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'LEAVE_REMINDER' | 'POLICY_UPDATE' | 'TRAINING_REMINDER' | 'CUSTOM';
  subject: string;
  content: string;
  recipients: 'ALL' | 'MANAGERS' | 'HR' | 'SPECIFIC';
  is_active: boolean;
  schedule_frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
  schedule_time?: string;
  schedule_days_before?: number;
}

// Pagination interface
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// API Service class
class ApiService {
  // Attendance APIs (RBAC)
  async attendanceMark(payload: { latitude?: number; longitude?: number; accuracy?: number; address?: string }) {
    try {
      const response = await api.post('/api/attendance/mark', payload || {});
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'mark attendance', null);
    }
  }

  async attendanceAutoLogin(payload: { latitude?: number; longitude?: number; accuracy?: number; address?: string }) {
    try {
      const response = await api.post('/api/attendance/auto-login', payload || {});
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'auto-login', null);
    }
  }

  async attendanceGpsMark(payload: { latitude: number; longitude: number; accuracy?: number; address?: string }) {
    try {
      const response = await api.post('/api/attendance/gps-mark', payload);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'gps mark', null);
    }
  }

  async attendanceAutoClockIn(payload: { latitude?: number; longitude?: number; accuracy?: number; address?: string }) {
    try {
      const response = await api.post('/api/attendance/auto-clock-in', payload || {});
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'auto clock-in', null);
    }
  }

  async attendanceAutoClockOut(payload: { latitude?: number; longitude?: number; accuracy?: number; address?: string }) {
    try {
      const response = await api.post('/api/attendance/auto-clock-out', payload || {});
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'auto clock-out', null);
    }
  }

  async attendanceManual(payload: { date: string; check_in_time?: string; check_out_time?: string; reason?: string }) {
    try {
      const response = await api.post('/api/attendance/manual', payload);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'submit manual attendance', null);
    }
  }

  async attendanceMyRecords() {
    try {
      const response = await api.get('/api/attendance/my-records');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch my attendance', []);
    }
  }

  async regularizationRequest(payload: { attendance_id: number; requested_change: string; reason?: string }) {
    try {
      const response = await api.post('/api/attendance/regularization/request', payload);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'request regularization', null);
    }
  }

  async regularizationMyStatus() {
    try {
      const response = await api.get('/api/attendance/regularization/my-status');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch my regularizations', []);
    }
  }

  // Manager endpoints
  async attendanceAll() {
    try {
      const response = await api.get('/api/attendance/all');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch all attendance', []);
    }
  }

  async manualPending() {
    try {
      const response = await api.get('/api/attendance/manual/pending');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch pending manual requests', []);
    }
  }

  async regularizationPending() {
    try {
      const response = await api.get('/api/attendance/regularization/pending');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch pending regularizations', []);
    }
  }

  async manualApprove(requestId: number, approve: boolean, remark?: string) {
    try {
      const response = await api.post('/api/attendance/manual/approve', { requestId, approve, remark });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'approve manual request', null);
    }
  }

  async regularizationApprove(requestId: number, approve: boolean) {
    try {
      const response = await api.post('/api/attendance/regularization/approve', { requestId, approve });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'approve regularization', null);
    }
  }

  // Employee APIs
  async getEmployees(page = 1, limit = 10, search = '') {
    try {
      return await retryApiCall(async () => {
        const response = await api.get('/api/employees', {
          params: { page, limit, search }
        });
        return response.data;
      });
    } catch (error: any) {
      return handleApiError(error, 'fetch employees', { content: [], totalElements: 0 });
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch current user', null);
    }
  }

  async getCurrentEmployeeProfile() {
    try {
      const userRes = await this.getCurrentUser();
      if (userRes.success && userRes.data && userRes.data.employeeId) {
        return await this.getEmployeeById(userRes.data.employeeId);
      }
      return { success: false, message: 'Employee profile not link to user' };
    } catch (error: any) {
      return handleApiError(error, 'fetch current employee profile', null);
    }
  }

  async getEmployeeById(id: number) {
    try {
      return await retryApiCall(async () => {
        const response = await api.get(`/api/employees/${id}`);
        return response.data;
      });
    } catch (error: any) {
      return handleApiError(error, 'fetch employee details', null);
    }
  }

  async createEmployee(employee: Omit<Employee, 'id'>) {
    const response = await api.post('/api/employees/create', employee);
    return response.data;
  }

  async createEmployeeWithPhoto(employee: Omit<Employee, 'id'>, photo?: File) {
    const formData = new FormData();

    // Add employee data
    Object.keys(employee).forEach(key => {
      const value = (employee as any)[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add photo if provided
    if (photo) {
      formData.append('photo', photo);
    }

    const response = await apiUpload.post('/api/employees', formData);
    return response.data;
  }

  async updateEmployee(id: number, employee: Partial<Employee>) {
    const response = await api.put(`/api/employees/${id}/update`, employee);
    return response.data;
  }

  async updateEmployeeWithPhoto(id: number, employee: Partial<Employee>, photo?: File) {
    const formData = new FormData();

    // Add employee data
    Object.keys(employee).forEach(key => {
      const value = (employee as any)[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add photo if provided
    if (photo) {
      formData.append('photo', photo);
    }

    const response = await apiUpload.put(`/api/employees/${id}`, formData);
    return response.data;
  }

  async deleteEmployee(id: number) {
    const response = await api.delete(`/api/employees/${id}`);
    return response.data;
  }

  async searchEmployees(filters: any, page: number, limit: number) {
    const response = await api.get('/api/employees/search', { params: { ...filters, page, limit } });
    return response.data;
  }

  async uploadEmployeePhoto(photo: File) {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await apiUpload.post('/api/employees/upload-photo', formData);
    return response.data;
  }

  async uploadEmployeeDocument(formData: FormData) {
    const response = await apiUpload.post('/api/employees/documents/upload', formData);
    return response.data;
  }

  async getEmployeeDocuments(employeeId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`/api/employees/${employeeId}/documents`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch employee documents', []);
    }
  }

  async deleteEmployeeDocument(documentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/employees/documents/${documentId}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete employee document', null);
    }
  }

  // Master Data APIs
  async getManpowerTypes(): Promise<ApiResponse<ManpowerType[]>> {
    try {
      return await retryApiCall(async () => {
        const response = await api.get('/api/master-data/manpower-types');
        return response.data;
      });
    } catch (error: any) {
      return handleApiError(error, 'fetch manpower types', []);
    }
  }

  async createManpowerType(manpowerType: ManpowerType) {
    try {
      return await retryApiCall(async () => {
        const response = await api.post('/api/master-data/manpower-types', manpowerType);
        return response.data;
      });
    } catch (error: any) {
      return handleApiError(error, 'create manpower type', null);
    }
  }

  async updateManpowerType(id: number, manpowerType: ManpowerType) {
    try {
      return await retryApiCall(async () => {
        const response = await api.put(`/api/master-data/manpower-types/${id}`, manpowerType);
        return response.data;
      });
    } catch (error: any) {
      return handleApiError(error, 'update manpower type', null);
    }
  }

  async deleteManpowerType(id: number) {
    try {
      return await retryApiCall(async () => {
        const response = await api.delete(`/api/master-data/manpower-types/${id}`);
        return response.data;
      });
    } catch (error: any) {
      return handleApiError(error, 'delete manpower type', null);
    }
  }

  // Department APIs
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    try {
      const response = await api.get('/api/master-data/departments');
      return response.data;
    } catch (error: any) {
      console.error('Error in getDepartments:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to fetch departments',
        data: []
      };
    }
  }

  async createDepartment(department: Department) {
    try {
      const response = await api.post('/api/master-data/departments', department);
      return response.data;
    } catch (error: any) {
      console.error('Error in createDepartment:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to create department',
        data: null
      };
    }
  }

  async updateDepartment(id: number, department: Department) {
    try {
      const response = await api.put(`/api/master-data/departments/${id}`, department);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateDepartment:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to update department',
        data: null
      };
    }
  }

  async deleteDepartment(id: number) {
    try {
      const response = await api.delete(`/api/master-data/departments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in deleteDepartment:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to delete department',
        data: null
      };
    }
  }

  // Designation APIs
  async getDesignations(): Promise<ApiResponse<Designation[]>> {
    try {
      const response = await api.get('/api/master-data/designations');
      return response.data;
    } catch (error: any) {
      console.error('Error in getDesignations:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to fetch designations',
        data: []
      };
    }
  }

  async getDesignationsByDepartment(departmentId: number) {
    try {
      const response = await api.get(`/api/master-data/designations/by-department/${departmentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getDesignationsByDepartment:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to fetch designations by department',
        data: []
      };
    }
  }

  async createDesignation(designation: Designation) {
    try {
      const response = await api.post('/api/master-data/designations', designation);
      return response.data;
    } catch (error: any) {
      console.error('Error in createDesignation:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to create designation',
        data: null
      };
    }
  }

  async updateDesignation(id: number, designation: Designation) {
    try {
      const response = await api.put(`/api/master-data/designations/${id}`, designation);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateDesignation:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to update designation',
        data: null
      };
    }
  }

  async deleteDesignation(id: number) {
    try {
      const response = await api.delete(`/api/master-data/designations/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in deleteDesignation:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to delete designation',
        data: null
      };
    }
  }

  // Shift APIs
  async getShifts(): Promise<ApiResponse<Shift[]>> {
    try {
      const response = await api.get('/api/master-data/shifts');
      return response.data;
    } catch (error: any) {
      console.error('Error in getShifts:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to fetch shifts',
        data: []
      };
    }
  }

  async createShift(shift: Shift) {
    try {
      const response = await api.post('/api/master-data/shifts', shift);
      return response.data;
    } catch (error: any) {
      console.error('Error in createShift:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to create shift',
        data: null
      };
    }
  }

  async updateShift(id: number, shift: Shift) {
    try {
      const response = await api.put(`/api/master-data/shifts/${id}`, shift);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateShift:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to update shift',
        data: null
      };
    }
  }

  async deleteShift(id: number) {
    try {
      const response = await api.delete(`/api/master-data/shifts/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in deleteShift:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to delete shift',
        data: null
      };
    }
  }

  // Work Location APIs
  async getWorkLocations(): Promise<ApiResponse<WorkLocation[]>> {
    try {
      const response = await api.get('/api/master-data/work-locations');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch work locations', []);
    }
  }

  async createWorkLocation(location: WorkLocation) {
    try {
      const response = await api.post('/api/master-data/work-locations', location);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create work location', null);
    }
  }

  async updateWorkLocation(id: number, location: WorkLocation) {
    try {
      const response = await api.put(`/api/master-data/work-locations/${id}`, location);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update work location', null);
    }
  }

  async deleteWorkLocation(id: number) {
    try {
      const response = await api.delete(`/api/master-data/work-locations/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete work location', null);
    }
  }

  // Bank APIs
  async getBanks(): Promise<ApiResponse<Bank[]>> {
    const response = await api.get('/api/master-data/banks');
    return response.data;
  }

  async createBank(bank: Bank) {
    const response = await api.post('/api/master-data/banks', bank);
    return response.data;
  }

  async updateBank(id: number, bank: Bank) {
    const response = await api.put(`/api/master-data/banks/${id}`, bank);
    return response.data;
  }

  async deleteBank(id: number) {
    const response = await api.delete(`/api/master-data/banks/${id}`);
    return response.data;
  }

  // Payment Mode APIs
  async getPaymentModes(): Promise<ApiResponse<PaymentMode[]>> {
    const response = await api.get('/api/master-data/payment-modes');
    return response.data;
  }

  async createPaymentMode(paymentMode: PaymentMode) {
    const response = await api.post('/api/master-data/payment-modes', paymentMode);
    return response.data;
  }

  async updatePaymentMode(id: number, paymentMode: PaymentMode) {
    const response = await api.put(`/api/master-data/payment-modes/${id}`, paymentMode);
    return response.data;
  }

  async deletePaymentMode(id: number) {
    const response = await api.delete(`/api/master-data/payment-modes/${id}`);
    return response.data;
  }

  // Qualification APIs
  async getQualifications(): Promise<ApiResponse<Qualification[]>> {
    const response = await api.get('/api/master-data/qualifications');
    return response.data;
  }

  async createQualification(qualification: Qualification) {
    const response = await api.post('/api/master-data/qualifications', qualification);
    return response.data;
  }

  async updateQualification(id: number, qualification: Qualification) {
    const response = await api.put(`/api/master-data/qualifications/${id}`, qualification);
    return response.data;
  }

  async deleteQualification(id: number) {
    const response = await api.delete(`/api/master-data/qualifications/${id}`);
    return response.data;
  }

  // Document Type APIs
  async getDocumentTypes(): Promise<ApiResponse<DocumentType[]>> {
    const response = await api.get('/api/master-data/document-types');
    return response.data;
  }

  async createDocumentType(documentType: any) {
    const response = await api.post('/api/master-data/document-types', documentType);
    return response.data;
  }

  async updateDocumentType(id: number, documentType: any) {
    const response = await api.put(`/api/master-data/document-types/${id}`, documentType);
    return response.data;
  }

  async deleteDocumentType(id: number) {
    const response = await api.delete(`/api/master-data/document-types/${id}`);
    return response.data;
  }

  // Customer APIs
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await api.get('/api/master-data/customers');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch customers', []);
    }
  }

  async createCustomer(customer: Customer) {
    try {
      const response = await api.post('/api/master-data/customers', customer);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create customer', null);
    }
  }

  async updateCustomer(id: number, customer: Customer) {
    try {
      const response = await api.put(`/api/master-data/customers/${id}`, customer);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update customer', null);
    }
  }

  async deleteCustomer(id: number) {
    try {
      const response = await api.delete(`/api/master-data/customers/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete customer', null);
    }
  }

  // Project APIs
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const response = await api.get('/api/master-data/projects');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch projects', []);
    }
  }

  async createProject(project: Project) {
    try {
      const response = await api.post('/api/master-data/projects', project);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create project', null);
    }
  }

  async updateProject(id: number, project: Project) {
    try {
      const response = await api.put(`/api/master-data/projects/${id}`, project);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update project', null);
    }
  }

  async deleteProject(id: number) {
    try {
      const response = await api.delete(`/api/master-data/projects/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete project', null);
    }
  }


  // Leave APIs
  async getLeaveTypes(): Promise<ApiResponse<LeaveType[]>> {
    const response = await api.get('/api/leave/types');
    return response.data;
  }

  async getLeaveRequests() {
    const response = await api.get('/api/leave');
    return response.data;
  }

  async getLeaveRequestById(id: number) {
    const response = await api.get(`/api/leave/${id}`);
    return response.data;
  }

  async createLeaveRequest(leaveRequest: LeaveApplication) {
    const response = await api.post('/api/leave', leaveRequest);
    return response.data;
  }

  async updateLeaveRequestStatus(id: number, status: string, approvedBy: number) {
    const response = await api.put(`/api/leave/${id}/status`, { status, approvedBy });
    return response.data;
  }

  // Expense APIs
  async getExpenseCategories(): Promise<ApiResponse<ExpenseCategory[]>> {
    const response = await api.get('/api/expenses/categories');
    return response.data;
  }

  async getExpenseRequests() {
    const response = await api.get('/api/expenses');
    return response.data;
  }

  async createExpenseRequest(expenseRequest: ExpenseRequest) {
    const response = await api.post('/api/expenses', expenseRequest);
    return response.data;
  }

  async updateExpenseRequestStatus(id: number, status: string, approvedBy: number) {
    const response = await api.put(`/api/expenses/${id}/status`, { status, approvedBy });
    return response.data;
  }

  // Payroll APIs
  async getSalaryComponents(): Promise<ApiResponse<SalaryComponent[]>> {
    const response = await api.get('/api/payroll/components');
    return response.data;
  }

  async getEmployeeSalary(employeeId: number): Promise<ApiResponse<EmployeeSalary[]>> {
    const response = await api.get(`/api/payroll/employee-salary/${employeeId}`);
    return response.data;
  }

  // PDF Generation APIs
  async generateKPIPDF(kpiId: number): Promise<ApiResponse<{ filePath: string; fileName: string }>> {
    const response = await api.post(`/api/pdf/kpi/${kpiId}/generate`);
    return response.data;
  }

  async downloadKPIPDF(kpiId: number): Promise<Blob> {
    try {
      const response = await api.get(`/api/pdf/kpi/${kpiId}/download`, {
        responseType: 'blob',
      });

      // Check if response is actually an error JSON (sometimes errors come as blobs)
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to download PDF');
      }

      return response.data;
    } catch (error: any) {
      // If it's an axios error with response, try to parse error message
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to download PDF');
        } catch (parseError) {
          throw new Error('Failed to download PDF. Please try again.');
        }
      }
      throw error;
    }
  }

  async generateAssetPDF(assetId: number): Promise<ApiResponse<{ filePath: string; fileName: string }>> {
    const response = await api.post(`/api/pdf/asset/${assetId}/generate`);
    return response.data;
  }

  async downloadAssetPDF(assetId: number): Promise<Blob> {
    const response = await api.get(`/api/pdf/asset/${assetId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async generateEmployeeFormPDF(formType: string, formId: number): Promise<ApiResponse<{ filePath: string; fileName: string }>> {
    const response = await api.post(`/api/pdf/form/${formType}/${formId}/generate`);
    return response.data;
  }

  async downloadEmployeeFormPDF(formType: string, formId: number): Promise<Blob> {
    const response = await api.get(`/api/pdf/form/${formType}/${formId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // CSV Export APIs
  async exportKPIToCSV(): Promise<Blob> {
    const response = await api.get('/api/csv-export/kpi', {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv',
      },
    });
    return response.data;
  }

  async exportAssetsToCSV(): Promise<Blob> {
    const response = await api.get('/api/csv-export/assets', {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv',
      },
    });
    return response.data;
  }

  async exportEmployeeFormsToCSV(formType: 'LEAVE' | 'EXPENSE'): Promise<Blob> {
    const response = await api.get(`/api/csv-export/employee-forms/${formType}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv',
      },
    });
    return response.data;
  }

  async updateEmployeeSalary(employeeSalary: EmployeeSalary): Promise<ApiResponse<any>> {
    const response = await api.put('/api/payroll/employee-salary', employeeSalary);
    return response.data;
  }

  async getPayslips(): Promise<ApiResponse<Payslip[]>> {
    const response = await api.get('/api/payroll');
    return response.data;
  }

  async getPayslipById(id: number): Promise<ApiResponse<Payslip>> {
    const response = await api.get(`/api/payroll/${id}`);
    return response.data;
  }

  async createPayslip(payslip: Payslip): Promise<ApiResponse<any>> {
    const response = await api.post('/api/payroll', payslip);
    return response.data;
  }

  async updatePayslip(id: number, payslip: Payslip): Promise<ApiResponse<any>> {
    const response = await api.put(`/api/payroll/${id}`, payslip);
    return response.data;
  }

  // Dashboard APIs
  async getDashboardStats() {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  }

  async getRecentActivities() {
    const response = await api.get('/api/dashboard/recent-activities');
    return response.data;
  }

  async getSystemHealth() {
    const response = await api.get('/api/dashboard/health');
    return response.data;
  }

  // Asset APIs
  async getAssetsByEmployee(employeeId: number) {
    try {
      const response = await api.get(`/api/assets/employee/${employeeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching employee assets:', error);
      if (error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error.message || 'Failed to fetch employee assets',
        data: []
      };
    }
  }

  // Task Management APIs
  async getMyTasks(filters?: { status?: string; priority?: string; deadline?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.deadline) params.append('deadline', filters.deadline);

    const response = await api.get(`/api/tasks/my?${params.toString()}`);
    return response.data;
  }

  async getHRTasks(filters?: { status?: string; priority?: string; assignedTo?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo.toString());

    const response = await api.get(`/api/tasks/hr/list?${params.toString()}`);
    return response.data;
  }

  async getAllTasks(filters?: { status?: string; priority?: string; assignedTo?: number; createdBy?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo.toString());
    if (filters?.createdBy) params.append('createdBy', filters.createdBy.toString());

    const response = await api.get(`/api/tasks/all/list?${params.toString()}`);
    return response.data;
  }

  async getTaskById(taskId: number) {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    assignedTo: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: string;
  }) {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  }

  async updateTask(taskId: number, taskData: {
    title?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: string;
  }) {
    const response = await api.put(`/api/tasks/${taskId}`, taskData);
    return response.data;
  }

  async updateTaskStatus(taskId: number, status: string) {
    const response = await api.put(`/api/tasks/${taskId}/status`, { status });
    return response.data;
  }

  async reassignTask(taskId: number, assignedTo: number) {
    const response = await api.put(`/api/tasks/${taskId}/reassign`, { assignedTo });
    return response.data;
  }

  async addTaskComment(taskId: number, comment: string) {
    const response = await api.post(`/api/tasks/${taskId}/comment`, { comment });
    return response.data;
  }

  async uploadTaskFile(taskId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiUpload.post(`/api/tasks/${taskId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getTaskActivityLogs(taskId: number) {
    const response = await api.get(`/api/tasks/${taskId}/logs`);
    return response.data;
  }

  async getTaskStats() {
    const response = await api.get('/api/tasks/stats');
    return response.data;
  }

  async getTaskUsers() {
    const response = await api.get('/api/tasks/users');
    return response.data;
  }

  async closeTask(taskId: number) {
    const response = await api.put(`/api/tasks/${taskId}/close`);
    return response.data;
  }

  async reopenTask(taskId: number, status?: string) {
    const response = await api.put(`/api/tasks/${taskId}/reopen`, { status });
    return response.data;
  }

  // Promotion APIs
  async getPromotions(): Promise<ApiResponse<Promotion[]>> {
    try {
      const response = await api.get('/api/promotions');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch promotions', []);
    }
  }

  async getPromotionById(id: number): Promise<ApiResponse<Promotion>> {
    try {
      const response = await api.get(`/api/promotions/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch promotion', null);
    }
  }

  async getEmployeeCareerProgression(employeeId: number): Promise<ApiResponse<Promotion[]>> {
    try {
      const response = await api.get(`/api/promotions/employee/${employeeId}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch career progression', []);
    }
  }

  async createPromotion(promotion: Promotion): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/promotions', promotion);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create promotion', null);
    }
  }

  async updatePromotion(id: number, promotion: Partial<Promotion>): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/promotions/${id}`, promotion);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update promotion', null);
    }
  }

  // Benefit APIs
  async getInsurancePolicies(): Promise<ApiResponse<InsurancePolicy[]>> {
    try {
      const response = await api.get('/api/benefits/insurance-policies');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch insurance policies', []);
    }
  }

  async createInsurancePolicy(policy: InsurancePolicy): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/benefits/insurance-policies', policy);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create insurance policy', null);
    }
  }

  async getInsuranceClaims(): Promise<ApiResponse<InsuranceClaim[]>> {
    try {
      const response = await api.get('/api/benefits/insurance-claims');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch insurance claims', []);
    }
  }

  async createInsuranceClaim(claim: InsuranceClaim): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/benefits/insurance-claims', claim);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'submit insurance claim', null);
    }
  }

  async getGratuityRecords(): Promise<ApiResponse<GratuityRecord[]>> {
    try {
      const response = await api.get('/api/benefits/gratuity-records');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch gratuity records', []);
    }
  }

  async syncGratuityRecords(): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/benefits/sync-gratuity-records');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'sync gratuity records', null);
    }
  }

  // Notification APIs
  async getNotificationTemplates(): Promise<ApiResponse<NotificationTemplate[]>> {
    try {
      const response = await api.get('/api/communication/notification-templates');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch notification templates', []);
    }
  }

  async createNotificationTemplate(template: NotificationTemplate): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/communication/notification-templates', template);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create notification template', null);
    }
  }

  async updateNotificationTemplate(id: number, template: Partial<NotificationTemplate>): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/communication/notification-templates/${id}`, template);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update notification template', null);
    }
  }

  async deleteNotificationTemplate(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/communication/notification-templates/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete notification template', null);
    }
  }

  async sendNotificationTemplate(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post(`/api/communication/notification-templates/${id}/send`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'send notification template', null);
    }
  }

  async getNotificationHistory(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/communication/notification-history');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch notification history', []);
    }
  }

  async getUpcomingBirthdays(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/communication/birthday-reminders');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch upcoming birthdays', []);
    }
  }

  async sendBirthdayReminders(): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/communication/birthday-reminders', {});
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'send birthday reminders', null);
    }
  }

  async getNotificationSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get('/api/communication/notification-settings/1'); // Assuming ID 1 for now
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch notification settings', null);
    }
  }

  async updateNotificationSetting(id: number, settings: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/communication/notification-settings/${id}`, settings);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update notification settings', null);
    }
  }

  async getBellNotifications(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/communication/bell-notifications');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch bell notifications', []);
    }
  }

  async markBellNotificationRead(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.patch(`/api/communication/bell-notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'mark notification as read', null);
    }
  }

  async markAllBellNotificationsRead(): Promise<ApiResponse<any>> {
    try {
      const response = await api.patch('/api/communication/bell-notifications/read-all');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'mark all notifications as read', null);
    }
  }

  // Training APIs
  async getTrainingPrograms(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/training/training-programs');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch training programs', []);
    }
  }

  async createTrainingProgram(program: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/training/training-programs', program);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create training program', null);
    }
  }

  async updateTrainingProgram(id: number, program: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/training/training-programs/${id}`, program);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update training program', null);
    }
  }

  async deleteTrainingProgram(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/training/training-programs/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete training program', null);
    }
  }

  async getEmployeeTraining(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/training/employee-training');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch employee training', []);
    }
  }

  async enrollEmployee(enrollment: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/training/employee-training', enrollment);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'enroll employee', null);
    }
  }

  async updateEmployeeEnrollment(id: number, enrollment: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/training/employee-training/${id}`, enrollment);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update enrollment', null);
    }
  }

  async deleteEmployeeEnrollment(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/training/employee-training/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete enrollment', null);
    }
  }

  // Awards & Certifications APIs
  async getAwards(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/awards');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch awards', []);
    }
  }

  async createAward(award: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/awards', award);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create award', null);
    }
  }

  async updateAward(id: number, award: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/awards/${id}`, award);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update award', null);
    }
  }

  async deleteAward(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/awards/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete award', null);
    }
  }

  async getCertifications(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/awards/certifications');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch certifications', []);
    }
  }

  async createCertification(cert: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/awards/certifications', cert);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create certification', null);
    }
  }

  async updateCertification(id: number, cert: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/awards/certifications/${id}`, cert);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update certification', null);
    }
  }

  async deleteCertification(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/awards/certifications/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete certification', null);
    }
  }

  // Compliance APIs
  async getEsiRecords(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/compliance/esi');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch ESI records', []);
    }
  }

  async createEsiRecord(record: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/compliance/esi', record);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create ESI record', null);
    }
  }

  async updateEsiRecord(id: number, record: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/compliance/esi/${id}`, record);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update ESI record', null);
    }
  }

  async deleteEsiRecord(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/compliance/esi/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete ESI record', null);
    }
  }

  async getPfRecords(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/compliance/pf');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch PF records', []);
    }
  }

  async createPfRecord(record: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/compliance/pf', record);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create PF record', null);
    }
  }

  async updatePfRecord(id: number, record: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/compliance/pf/${id}`, record);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update PF record', null);
    }
  }

  async deletePfRecord(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/compliance/pf/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete PF record', null);
    }
  }

  async getComplianceSummary(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get('/api/compliance/summary');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch compliance summary', null);
    }
  }

  async syncComplianceRecords(month: number, year: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/compliance/sync', { month, year });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'sync compliance records', null);
    }
  }

  // Cards APIs
  async getIdCards(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/cards/id-cards');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch ID cards', []);
    }
  }

  async createOrUpdateIdCard(card: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/cards/id-cards', card);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create/update ID card', null);
    }
  }

  async updateIdCardStatus(id: number, status: string, remarks?: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/cards/id-cards/${id}/status`, { status, remarks });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update ID card status', null);
    }
  }

  async deleteIdCard(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/cards/id-cards/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete ID card', null);
    }
  }

  async getVisitingCards(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/api/cards/visiting-cards');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'fetch visiting cards', []);
    }
  }

  async createVisitingCard(card: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/api/cards/visiting-cards', card);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'create visiting card', null);
    }
  }

  async updateVisitingCard(id: number, card: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`/api/cards/visiting-cards/${id}`, card);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'update visiting card', null);
    }
  }

  async deleteVisitingCard(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/api/cards/visiting-cards/${id}`);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'delete visiting card', null);
    }
  }

  // Add more API methods for other entities...

}

export const apiService = new ApiService();
export default api;