import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CommandPalette from './components/common/CommandPalette';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OfficeListPage from './pages/offices/OfficeListPage';
import OfficeFormPage from './pages/offices/OfficeFormPage';
import OfficeDetailPage from './pages/offices/OfficeDetailPage';
import StaffListPage from './pages/staff/StaffListPage';
import StaffFormPage from './pages/staff/StaffFormPage';
import StaffDetailPage from './pages/staff/StaffDetailPage';
import LeaveListPage from './pages/leave/LeaveListPage';
import LeaveFormPage from './pages/leave/LeaveFormPage';
import LeaveBalancePage from './pages/leave/LeaveBalancePage';
import ComplaintListPage from './pages/complaints/ComplaintListPage';
import ComplaintFormPage from './pages/complaints/ComplaintFormPage';
import InquiryListPage from './pages/inquiries/InquiryListPage';
import InquiryFormPage from './pages/inquiries/InquiryFormPage';
import InspectionProgrammePage from './pages/inspections/InspectionProgrammePage';
import InspectionDetailPage from './pages/inspections/InspectionDetailPage';
import InspectionProgrammeFormPage from './pages/inspections/InspectionProgrammeFormPage';
import ArticlesListPage from './pages/articles/ArticlesListPage';
import ArticlesFormPage from './pages/articles/ArticlesFormPage';
import VPArticleFormPage from './pages/articles/VPArticleFormPage';
import LateDeliveryFormPage from './pages/articles/LateDeliveryFormPage';
import RevenueListPage from './pages/revenue/RevenueListPage';
import RevenueFormPage from './pages/revenue/RevenueFormPage';
import RevenueDetailPage from './pages/revenue/RevenueDetailPage';
import SettingsPage from './pages/settings/SettingsPage';
import AuditLogPage from './pages/settings/AuditLogPage';
import UsersPage from './pages/settings/UsersPage';
import PostmasterDashboardPage from './pages/dashboard/PostmasterDashboardPage';
import TransferListPage   from './pages/transfers/TransferListPage';
import TransferFormPage   from './pages/transfers/TransferFormPage';
import TransferDetailPage from './pages/transfers/TransferDetailPage';
import LookAfterListPage   from './pages/lookAfter/LookAfterListPage';
import LookAfterFormPage   from './pages/lookAfter/LookAfterFormPage';
import LookAfterDetailPage from './pages/lookAfter/LookAfterDetailPage';
import AttendanceRegisterPage from './pages/attendance/AttendanceRegisterPage';
import AttendanceReportPage   from './pages/attendance/AttendanceReportPage';
import LeaveMemoFormPage      from './pages/attendance/LeaveMemoFormPage';
import EDBOProgrammeListPage   from './pages/edbo/EDBOProgrammeListPage';
import EDBOProgrammeFormPage   from './pages/edbo/EDBOProgrammeFormPage';
import EDBOProgrammeDetailPage from './pages/edbo/EDBOProgrammeDetailPage';
import OverseerDiaryListPage from './pages/overseerDiary/OverseerDiaryListPage';
import OverseerDiaryFormPage from './pages/overseerDiary/OverseerDiaryFormPage';
import WorkAssignmentListPage from './pages/workAssignments/WorkAssignmentListPage';
import WorkAssignmentFormPage from './pages/workAssignments/WorkAssignmentFormPage';
import VPDeliveryPage     from './pages/vpDelivery/VPDeliveryPage';
import VPDeliveryFormPage from './pages/vpDelivery/VPDeliveryFormPage';
import VPRouteFormPage    from './pages/vpDelivery/VPRouteFormPage';

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

// Sends each role to their home page
function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'postmaster') return <Navigate to="/postmaster-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Redirects postmaster users away from admin-only areas
function AdminOnly() {
  const { user } = useAuth();
  if (user?.role === 'postmaster') return <Navigate to="/postmaster-dashboard" replace />;
  return <Outlet />;
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-surface dark:text-dark-text transition-colors duration-300">
      <TopBar onMenuToggle={() => setSidebarOpen((p) => !p)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-14 pb-16 md:pb-4 md:pl-60 min-h-screen">
        <div className="p-4 md:p-6 max-w-screen-xl">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CommandPalette />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/postmaster-dashboard" element={<PostmasterDashboardPage />} />
              {/* Postmaster-accessible routes */}
              <Route path="/revenue" element={<RevenueListPage />} />
              <Route path="/revenue/new" element={<RevenueFormPage />} />
              <Route path="/revenue/:id" element={<RevenueDetailPage />} />
              <Route path="/revenue/:id/edit" element={<RevenueFormPage />} />
              <Route path="/articles" element={<ArticlesListPage />} />
              <Route path="/articles/new" element={<ArticlesFormPage />} />
              <Route path="/articles/entry" element={<ArticlesFormPage />} />
              <Route path="/articles/vp/new" element={<VPArticleFormPage />} />
              <Route path="/articles/vp/:id/edit" element={<VPArticleFormPage />} />
              <Route path="/articles/late/new" element={<LateDeliveryFormPage />} />
              {/* Admin-only routes */}
              <Route element={<AdminOnly />}>
                <Route path="/offices" element={<OfficeListPage />} />
                <Route path="/offices/new" element={<OfficeFormPage />} />
                <Route path="/offices/:id" element={<OfficeDetailPage />} />
                <Route path="/offices/:id/edit" element={<OfficeFormPage />} />
                <Route path="/staff" element={<StaffListPage />} />
                <Route path="/staff/new" element={<StaffFormPage />} />
                <Route path="/staff/:id" element={<StaffDetailPage />} />
                <Route path="/staff/:id/edit" element={<StaffFormPage />} />
                <Route path="/leave" element={<LeaveListPage />} />
                <Route path="/leave/balance" element={<LeaveBalancePage />} />
                <Route path="/leave/new" element={<LeaveFormPage />} />
                <Route path="/transfers"     element={<TransferListPage />} />
                <Route path="/transfers/new" element={<TransferFormPage />} />
                <Route path="/transfers/:id" element={<TransferDetailPage />} />
                <Route path="/look-after"      element={<LookAfterListPage />} />
                <Route path="/look-after/new"  element={<LookAfterFormPage />} />
                <Route path="/look-after/:id"  element={<LookAfterDetailPage />} />
                <Route path="/attendance"                element={<AttendanceRegisterPage />} />
                <Route path="/attendance/report"         element={<AttendanceReportPage />} />
                <Route path="/attendance/leave-memo/new" element={<LeaveMemoFormPage />} />
                <Route path="/edbo-programme"            element={<EDBOProgrammeListPage />} />
                <Route path="/edbo-programme/new"        element={<EDBOProgrammeFormPage />} />
                <Route path="/edbo-programme/:id"        element={<EDBOProgrammeDetailPage />} />
                <Route path="/overseer-diary"            element={<OverseerDiaryListPage />} />
                <Route path="/overseer-diary/new"        element={<OverseerDiaryFormPage />} />
                <Route path="/overseer-diary/:id"        element={<OverseerDiaryFormPage />} />
                <Route path="/work-assignments"          element={<WorkAssignmentListPage />} />
                <Route path="/work-assignments/new"      element={<WorkAssignmentFormPage />} />
                <Route path="/work-assignments/:id"      element={<WorkAssignmentFormPage />} />
                <Route path="/vp-delivery"               element={<VPDeliveryPage />} />
                <Route path="/vp-delivery/log/new"       element={<VPDeliveryFormPage />} />
                <Route path="/vp-delivery/log/:id/edit"  element={<VPDeliveryFormPage />} />
                <Route path="/vp-routes/new"             element={<VPRouteFormPage />} />
                <Route path="/vp-routes/:id/edit"        element={<VPRouteFormPage />} />
                <Route path="/inspections" element={<InspectionProgrammePage />} />
                <Route path="/inspections/programme/new" element={<InspectionProgrammeFormPage />} />
                <Route path="/inspections/:id" element={<InspectionDetailPage />} />
                <Route path="/complaints" element={<ComplaintListPage />} />
                <Route path="/complaints/new" element={<ComplaintFormPage />} />
                <Route path="/complaints/:id" element={<ComplaintFormPage />} />
                <Route path="/inquiries" element={<InquiryListPage />} />
                <Route path="/inquiries/new" element={<InquiryFormPage />} />
                <Route path="/inquiries/:id" element={<InquiryFormPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/users" element={<UsersPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);
}
