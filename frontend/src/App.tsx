import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './store/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public pages
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ClubDirectory } from './pages/public/ClubDirectory';
import { EventsDirectory } from './pages/public/EventsDirectory';

// Student pages
import { StudentOverview } from './pages/student/StudentOverview';
import { StudentMyClubs } from './pages/student/StudentMyClubs';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { StudentTranscript } from './pages/student/StudentTranscript';
import { StudentNotifications } from './pages/student/StudentNotifications';
import { ClubRegistrationForm } from './pages/student/ClubRegistrationForm';

// Executive pages
import { ExecutiveOverview } from './pages/executive/ExecutiveOverview';
import { ExecutiveEvents } from './pages/executive/ExecutiveEvents';
import { ExecutiveMembershipRequests } from './pages/executive/ExecutiveMembershipRequests';
import { ExecutiveClubProfile } from './pages/executive/ExecutiveClubProfile';
import { ExecutiveAttendance } from './pages/executive/ExecutiveAttendance';
import { ExecutiveHandover } from './pages/executive/ExecutiveHandover';

// Admin pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminClubs } from './pages/admin/AdminClubs';
import { AdminRegistrations } from './pages/admin/AdminRegistrations';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminLeadership } from './pages/admin/AdminLeadership';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminAcademicSessions } from './pages/admin/AdminAcademicSessions';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ─── Student Routes ─── */}
            <Route path="/student/overview"       element={<ProtectedRoute><StudentOverview /></ProtectedRoute>} />
            <Route path="/student/my-clubs"       element={<ProtectedRoute><StudentMyClubs /></ProtectedRoute>} />
            <Route path="/student/attendance"     element={<ProtectedRoute><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/transcript"     element={<ProtectedRoute><StudentTranscript /></ProtectedRoute>} />
            <Route path="/student/notifications"  element={<ProtectedRoute><StudentNotifications /></ProtectedRoute>} />
            <Route path="/student/register-club"  element={<ProtectedRoute><ClubRegistrationForm /></ProtectedRoute>} />

            {/* ─── Executive Routes ─── */}
            <Route path="/executive/overview"             element={<ProtectedRoute><ExecutiveOverview /></ProtectedRoute>} />
            <Route path="/executive/profile"              element={<ProtectedRoute><ExecutiveClubProfile /></ProtectedRoute>} />
            <Route path="/executive/membership-requests"  element={<ProtectedRoute><ExecutiveMembershipRequests /></ProtectedRoute>} />
            <Route path="/executive/events"               element={<ProtectedRoute><ExecutiveEvents /></ProtectedRoute>} />
            <Route path="/executive/attendance"           element={<ProtectedRoute><ExecutiveAttendance /></ProtectedRoute>} />
            <Route path="/executive/handover"             element={<ProtectedRoute><ExecutiveHandover /></ProtectedRoute>} />

            {/* ─── Admin Routes ─── */}
            <Route path="/admin/overview"           element={<ProtectedRoute><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/clubs"              element={<ProtectedRoute><AdminClubs /></ProtectedRoute>} />
            <Route path="/admin/registrations"      element={<ProtectedRoute><AdminRegistrations /></ProtectedRoute>} />
            <Route path="/admin/students"           element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/leadership"         element={<ProtectedRoute><AdminLeadership /></ProtectedRoute>} />
            <Route path="/admin/reports"            element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/events"             element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
            <Route path="/admin/academic-sessions"  element={<ProtectedRoute><AdminAcademicSessions /></ProtectedRoute>} />

            {/* ─── Shared Directories ─── */}
            <Route path="/clubs"  element={<ProtectedRoute><ClubDirectory /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsDirectory /></ProtectedRoute>} />

            {/* Default */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
