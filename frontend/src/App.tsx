import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import RolesPage from "./pages/admin/RolesPage";
import RequestsPage from "./pages/admin/RequestsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import HomeCareAdminPage from "./pages/admin/HomeCareAdminPage";
import PeerSupportAdminPage from "./pages/admin/PeerSupportAdminPage";
import SurveysAdminPage from "./pages/admin/SurveysAdminPage";

import StudentDashboard from "./pages/student/StudentDashboard";
import NewRequestPage from "./pages/student/NewRequestPage";
import MyAppointmentsPage from "./pages/student/MyAppointmentsPage";
import MySupportPlansPage from "./pages/student/MySupportPlansPage";
import SurveysPage from "./pages/student/SurveysPage";

import DriverDashboard from "./pages/driver/DriverDashboard";
import MyRidesPage from "./pages/driver/MyRidesPage";

import CaregiverDashboard from "./pages/caregiver/CaregiverDashboard";
import CaregiverSchedulePage from "./pages/caregiver/CaregiverSchedulePage";

import AssistantDashboard from "./pages/assistant/AssistantDashboard";
import MyPlansPage from "./pages/assistant/MyPlansPage";

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "student") return <Navigate to="/student/dashboard" replace />;
  if (user.role === "driver") return <Navigate to="/driver/dashboard" replace />;
  if (user.role === "caregiver") return <Navigate to="/caregiver/dashboard" replace />;
  if (user.role === "assistant") return <Navigate to="/assistant/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/unauthorized" element={
            <div className="flex items-center justify-center h-screen text-gray-700 text-lg font-medium">
              Nemate pristup ovoj stranici.
            </div>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute role="admin"><Layout><AdminDashboard /></Layout></PrivateRoute>
          } />
          <Route path="/admin/requests" element={
            <PrivateRoute role="admin"><Layout><RequestsPage /></Layout></PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute role="admin"><Layout><UsersPage /></Layout></PrivateRoute>
          } />
          <Route path="/admin/roles" element={
            <PrivateRoute role="admin"><Layout><RolesPage /></Layout></PrivateRoute>
          } />
          <Route path="/admin/reports" element={
            <PrivateRoute role="admin"><Layout><ReportsPage /></Layout></PrivateRoute>
          } />
          <Route path="/admin/home-care" element={
            <PrivateRoute role="admin"><Layout><HomeCareAdminPage /></Layout></PrivateRoute>
          } />
          <Route path="/admin/peer-support" element={
            <PrivateRoute role="admin"><Layout><PeerSupportAdminPage /></Layout></PrivateRoute>
          } />
          <Route path="/admin/surveys" element={
            <PrivateRoute role="admin"><Layout><SurveysAdminPage /></Layout></PrivateRoute>
          } />

          {/* Student */}
          <Route path="/student/dashboard" element={
            <PrivateRoute role="student"><Layout><StudentDashboard /></Layout></PrivateRoute>
          } />
          <Route path="/student/new-request" element={
            <PrivateRoute role="student"><Layout><NewRequestPage /></Layout></PrivateRoute>
          } />
          <Route path="/student/appointments" element={
            <PrivateRoute role="student"><Layout><MyAppointmentsPage /></Layout></PrivateRoute>
          } />
          <Route path="/student/support-plans" element={
            <PrivateRoute role="student"><Layout><MySupportPlansPage /></Layout></PrivateRoute>
          } />
          <Route path="/student/surveys" element={
            <PrivateRoute role="student"><Layout><SurveysPage /></Layout></PrivateRoute>
          } />

          {/* Driver */}
          <Route path="/driver/dashboard" element={
            <PrivateRoute role="driver"><Layout><DriverDashboard /></Layout></PrivateRoute>
          } />
          <Route path="/driver/my-rides" element={
            <PrivateRoute role="driver"><Layout><MyRidesPage /></Layout></PrivateRoute>
          } />

          {/* Caregiver */}
          <Route path="/caregiver/dashboard" element={
            <PrivateRoute role="caregiver"><Layout><CaregiverDashboard /></Layout></PrivateRoute>
          } />
          <Route path="/caregiver/schedule" element={
            <PrivateRoute role="caregiver"><Layout><CaregiverSchedulePage /></Layout></PrivateRoute>
          } />

          {/* Assistant */}
          <Route path="/assistant/dashboard" element={
            <PrivateRoute role="assistant"><Layout><AssistantDashboard /></Layout></PrivateRoute>
          } />
          <Route path="/assistant/plans" element={
            <PrivateRoute role="assistant"><Layout><MyPlansPage /></Layout></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
