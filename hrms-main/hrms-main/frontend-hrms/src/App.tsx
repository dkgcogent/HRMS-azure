import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import Dashboard from './pages/Dashboard';
import { theme } from './theme/theme';
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
import CustomerList from './pages/Masters/CustomerList';
import ProjectList from './pages/Masters/ProjectList';
import LeaveForm from './pages/Leave/LeaveForm';
import LeaveApprovalForm from './pages/Leave/LeaveApprovalForm';
import LeaveBalanceForm from './pages/Leave/LeaveBalanceForm';
import PayrollForm from './pages/Payroll/PayrollForm';
import PayslipList from './pages/Payroll/PayslipList';
import PerformanceForm from './pages/Performance/PerformanceForm';
import AppraisalManagementForm from './pages/Performance/AppraisalManagementForm';
import ManagerKPIReview from './pages/Performance/ManagerKPIReview';
import HRKPIReview from './pages/Performance/HRKPIReview';
import CreateKPIForm from './pages/Performance/CreateKPIForm';
import KPIList from './pages/Performance/KPIList';
import TrainingProgramForm from './pages/Training/TrainingProgramForm';
import TrainingEnrollmentForm from './pages/Training/TrainingEnrollmentForm';
import TrainingManagementForm from './pages/Training/TrainingManagementForm';
import AwardsCertificationsForm from './pages/Awards/AwardsCertificationsForm';
import ComplianceForm from './pages/Compliance/ComplianceForm';
import CardManagementForm from './pages/Cards/CardManagementForm';
import HRPolicyForm from './pages/Policies/HRPolicyForm';
import JobPostingForm from './pages/Recruitment/JobPostingForm';
import LetterGenerationForm from './pages/Documents/LetterGenerationForm';
import OfferLetterForm from './pages/Documents/OfferLetterForm';
import OfferLetterList from './pages/Documents/OfferLetterList';
import MyOfferLetters from './pages/Documents/MyOfferLetters';
import AssetList from './pages/Assets/AssetList';
import AssetForm from './pages/Assets/AssetForm';
import AssetDetail from './pages/Assets/AssetDetail';
import InsuranceBenefitsForm from './pages/Benefits/InsuranceBenefitsForm';
import EmployeeDashboard from './pages/Attendance/EmployeeDashboard';
import ManagerDashboard from './pages/Attendance/ManagerDashboard';
import EmployeeAttendance from './pages/Attendance/EmployeeAttendance';
import NotificationManagementForm from './pages/Communication/NotificationManagementForm';
import EmployeeReports from './pages/Reports/EmployeeReports';
import ReportsDashboard from './pages/Reports/ReportsDashboard';
import EmployeeListReport from './pages/Reports/EmployeeListReport';
import EmployeeAnalytics from './pages/Reports/EmployeeAnalytics';
import Login from './pages/Auth/Login';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeTaskDashboard } from './pages/Tasks/EmployeeTaskDashboard';
import { HRTaskDashboard } from './pages/Tasks/HRTaskDashboard';
import { AdminTaskDashboard } from './pages/Tasks/AdminTaskDashboard';
import { TaskDetailPage } from './pages/Tasks/TaskDetailPage';
import { CreateTaskPage } from './pages/Tasks/CreateTaskPage';
import ProfileUpdateForm from './pages/SelfService/ProfileUpdateForm';
import './App.css';

const MainLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Header />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public login route without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* All authenticated routes wrapped in main layout */}
            <Route element={<MainLayout />}>
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
              <Route path="/payslips" element={<PayslipList />} />
              <Route path="/payslips/create" element={<PayrollForm />} />
              <Route path="/payslips/edit/:id" element={<PayrollForm />} />

              {/* Performance */}
              <Route path="/performance" element={<PerformanceForm />} />
              <Route path="/performance/new" element={<PerformanceForm />} />
              <Route path="/performance/edit/:id" element={<PerformanceForm />} />
              <Route path="/performance/appraisals" element={<AppraisalManagementForm />} />
              <Route path="/performance/appraisals/new" element={<AppraisalManagementForm />} />
              <Route path="/performance/appraisals/edit/:id" element={<AppraisalManagementForm />} />
              <Route path="/performance/kpi/create" element={<CreateKPIForm />} />
              <Route path="/performance/kpi/:id" element={<CreateKPIForm />} />
              <Route path="/performance/kpi/edit/:id" element={<CreateKPIForm />} />
              <Route path="/performance/kpi-list" element={<KPIList />} />
              <Route path="/performance/hr-review" element={<HRKPIReview />} />
              <Route path="/performance/manager-review" element={<ManagerKPIReview />} />

              {/* Training */}
              <Route path="/training" element={<TrainingManagementForm />} />
              <Route path="/training/programs" element={<TrainingProgramForm />} />
              <Route path="/training/enrollments" element={<TrainingEnrollmentForm />} />

              {/* Awards & Certifications */}
              <Route path="/awards" element={<AwardsCertificationsForm />} />

              {/* Compliance */}
              <Route path="/compliance" element={<ComplianceForm />} />

              {/* ID & Visiting Cards */}
              <Route path="/cards" element={<CardManagementForm />} />

              {/* HR Policies */}
              <Route path="/policies" element={<HRPolicyForm />} />

              {/* Recruitment */}
              <Route path="/recruitment/jobs" element={<JobPostingForm />} />

              {/* Documents */}
              <Route path="/documents/offer-letter" element={<OfferLetterList />} />
              <Route path="/documents/offer-letter/new" element={<OfferLetterForm />} />
              <Route path="/documents/my-offer-letter" element={<MyOfferLetters />} />
              <Route path="/documents/letters" element={<LetterGenerationForm />} />

              {/* Assets */}
              <Route path="/assets" element={<AssetList />} />
              <Route path="/assets/new" element={<AssetForm />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/assets/:id/edit" element={<AssetForm />} />

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
                  <RoleRoute roles={['hr', 'admin']}>
                    <ManagerDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/attendance/employee"
                element={
                  <RoleRoute roles={['hr', 'admin']}>
                    <EmployeeAttendance />
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
              <Route path="/masters/customers" element={<CustomerList />} />
              <Route path="/masters/projects" element={<ProjectList />} />

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

              {/* Task Management */}
              <Route
                path="/tasks/my"
                element={
                  <RoleRoute roles={['employee']}>
                    <EmployeeTaskDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/tasks/hr"
                element={
                  <RoleRoute roles={['hr', 'admin']}>
                    <HRTaskDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/tasks/admin"
                element={
                  <RoleRoute roles={['admin']}>
                    <AdminTaskDashboard />
                  </RoleRoute>
                }
              />
              <Route path="/tasks/create" element={<CreateTaskPage />} />
              <Route path="/tasks/:id" element={<TaskDetailPage />} />
              <Route path="/profile" element={<ProfileUpdateForm />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
