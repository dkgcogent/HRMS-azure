export const mockDepartments = [
  'IT',
  'HR',
  'Finance',
  'Operations',
  'Sales',
  'Marketing',
];

export const mockDesignations = [
  'Software Engineer',
  'Senior Software Engineer',
  'Tech Lead',
  'HR Manager',
  'Accountant',
  'Sales Executive',
];

export const mockEmployees = [
  { id: 'EMP001', name: 'John Doe', department: 'IT', designation: 'Software Engineer' },
  { id: 'EMP002', name: 'Jane Smith', department: 'HR', designation: 'HR Manager' },
  { id: 'EMP003', name: 'Mike Johnson', department: 'Finance', designation: 'Accountant' },
];

export const mockFinancialYears = [
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
];

export interface KRARow {
  id: string;
  kraName: string;
  description: string;
  frequency: string;
  weightage: number;
}

export interface KRATemplate {
  id: string;
  name: string;
  department: string;
  designation: string;
  financialYear: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'Draft' | 'Active' | 'Inactive';
  lastUpdated: string;
  items: KRARow[];
}


