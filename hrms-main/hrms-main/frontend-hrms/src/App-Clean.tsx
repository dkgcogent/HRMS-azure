import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/Employee/EmployeeList';
import EmployeeForm from './pages/Employee/EmployeeForm';
import EmployeeDocuments from './pages/Employee/EmployeeDocuments';
import EnhancedEmployeeProfile from './pages/Employee/EnhancedEmployeeProfile';
import ExitManagementForm from './pages/Employee/ExitManagementForm';
import PromotionManagementForm from './pages/Employee/PromotionManagementForm';
import ManpowerTypeList from './pages/Masters/ManpowerTypeList';
import DepartmentList from './pages/Masters/DepartmentList';
import DesignationList from './pages/Masters/DesignationList';
import ShiftList from './pages/Masters/ShiftList';
import WorkLocationList from './pages/Masters/WorkLocationList';
import BankList from './pages/Masters/BankList';
import PaymentModeList from './pages/Masters/PaymentModeList';
import QualificationList from './pages/Masters/QualificationList';
import DocumentTypeList from './pages/Masters/DocumentTypeList';
import LeaveForm from './pages/Leave/LeaveForm';
import LeaveApprovalForm from './pages/Leave/LeaveApprovalForm';
import LeaveBalanceForm from './pages/Leave/LeaveBalanceForm';
import PayrollForm from './pages/Payroll/PayrollForm';
import PerformanceForm from './pages/Performance/PerformanceForm';
import AppraisalManagementForm from './pages/Performance/AppraisalManagementForm';
import TrainingProgramForm from './pages/Training/TrainingProgramForm';
import TrainingEnrollmentForm from './pages/Training/TrainingEnrollmentForm';
import HRPolicyForm from './pages/Policies/HRPolicyForm';
import JobPostingForm from './pages/Recruitment/JobPostingForm';
import LetterGenerationForm from './pages/Documents/LetterGenerationForm';
import AssetManagementForm from './pages/Assets/AssetManagementForm';
import InsuranceBenefitsForm from './pages/Benefits/InsuranceBenefitsForm';
import EmployeeDashboard from './pages/Attendance/EmployeeDashboard';
import ManagerDashboard from './pages/Attendance/ManagerDashboard';
import NotificationManagementForm from './pages/Communication/NotificationManagementForm';
import EmployeeReports from './pages/Reports/EmployeeReports';
import ReportsDashboard from './pages/Reports/ReportsDashboard';
import EmployeeListReport from './pages/Reports/EmployeeListReport';
import EmployeeAnalytics from './pages/Reports/EmployeeAnalytics';
import Login from './pages/Auth/Login';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
              <Header />
              <Box sx={{ p: 3 }}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Employee Management */}
                  <Route path="/employees" element={<EmployeeList />} />
                  <Route path="/employees/new" element={<EmployeeForm />} />
                  <Route path="/employees/edit/:id" element={<EmployeeForm />} />
                  <Route path="/employees/:id/documents" element={<EmployeeDocuments />} />
                  <Route path="/employees/:id/profile" element={<EnhancedEmployeeProfile />} />
                  <Route path="/employees/:id/exit" element={<ExitManagementForm />} />
                  <Route path="/employees/:id/promotions" element={<PromotionManagementForm />} />
                  <Route path="/promotions" element={<PromotionManagementForm />} />
                  
                  {/* Leave Management */}
                  <Route path="/leave" element={<LeaveForm />} />
                  <Route path="/leave/new" element={<LeaveForm />} />
                  <Route path="/leave/edit/:id" element={<LeaveForm />} />
                  <Route path="/leave/approvals" element={<LeaveApprovalForm />} />
                  <Route path="/leave/balances" element={<LeaveBalanceForm />} />
                  
                  {/* Payroll */}
                  <Route path="/payroll" element={<PayrollForm />} />
                  <Route path="/payroll/new" element={<PayrollForm />} />
                  <Route path="/payroll/edit/:id" element={<PayrollForm />} />
                  
                  {/* Performance */}
                  <Route path="/performance" element={<PerformanceForm />} />
                  <Route path="/performance/new" element={<PerformanceForm />} />
                  <Route path="/performance/edit/:id" element={<PerformanceForm />} />
                  <Route path="/performance/appraisals" element={<AppraisalManagementForm />} />
                  <Route path="/performance/appraisals/new" element={<AppraisalManagementForm />} />
                  <Route path="/performance/appraisals/edit/:id" element={<AppraisalManagementForm />} />
                  
                  {/* Training */}
                  <Route path="/training/programs" element={<TrainingProgramForm />} />
                  <Route path="/training/enrollments" element={<TrainingEnrollmentForm />} />
                  
                  {/* HR Policies */}
                  <Route path="/policies" element={<HRPolicyForm />} />
                  
                  {/* Recruitment */}
                  <Route path="/recruitment/jobs" element={<JobPostingForm />} />
                  
                  {/* Documents */}
                  <Route path="/documents/letters" element={<LetterGenerationForm />} />
                  
                  {/* Assets */}
                  <Route path="/assets" element={<AssetManagementForm />} />
                  <Route path="/assets/new" element={<AssetManagementForm />} />
                  <Route path="/assets/edit/:id" element={<AssetManagementForm />} />
                  
                  {/* Benefits */}
                  <Route path="/benefits/insurance" element={<InsuranceBenefitsForm />} />
                  
                  {/* Attendance */}
                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute>
                        <EmployeeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/attendance/biometric" element={<Navigate to="/attendance" replace />} />
                  <Route
                    path="/manager/attendance"
                    element={
                      <RoleRoute roles={['manager','admin']}>
                        <ManagerDashboard />
                      </RoleRoute>
                    }
                  />
                  
                  {/* Communication */}
                  <Route path="/communication/notifications" element={<NotificationManagementForm />} />
                  
                  {/* Master Data */}
                  <Route path="/masters/manpower-types" element={<ManpowerTypeList />} />
                  <Route path="/masters/departments" element={<DepartmentList />} />
                  <Route path="/masters/designations" element={<DesignationList />} />
                  <Route path="/masters/shifts" element={<ShiftList />} />
                  <Route path="/masters/work-locations" element={<WorkLocationList />} />
                  <Route path="/masters/banks" element={<BankList />} />
                  <Route path="/masters/payment-modes" element={<PaymentModeList />} />
                  <Route path="/masters/qualifications" element={<QualificationList />} />
                  <Route path="/masters/document-types" element={<DocumentTypeList />} />
                  
                  {/* Reports */}
                  <Route path="/reports" element={<ReportsDashboard />} />
                  <Route path="/reports/employee-list" element={<EmployeeListReport />} />
                  <Route path="/reports/employee-analytics" element={<EmployeeAnalytics />} />
                  <Route path="/reports/employee-summary" element={<EmployeeReports />} />
                  <Route path="/reports/new-joiners" element={<EmployeeReports />} />
                  <Route path="/reports/department-wise" element={<EmployeeReports />} />
                  <Route path="/reports/master-data-summary" element={<EmployeeReports />} />
                  <Route path="/reports/department-designation" element={<EmployeeReports />} />
                  <Route path="/reports/growth-trends" element={<EmployeeReports />} />
                  <Route path="/reports/document-compliance" element={<EmployeeReports />} />
                  <Route path="/reports/data-audit" element={<EmployeeReports />} />
                </Routes>
              </Box>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
