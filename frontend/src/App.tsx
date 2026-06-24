import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ActivatePage from "./pages/auth/ActivatePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyPage from "./pages/VerifyPage";

import StudentsPage from "./pages/school/StudentsPage";
import TrainingsPage from "./pages/school/TrainingsPage";
import SettingsPage from "./pages/school/SettingsPage";
import SchoolDashboard from "./pages/school/SchoolDashboard";
import CertificationsPage from "./pages/school/CertificationsPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify/:token" element={<VerifyPage />} />

      {/* School */}
      <Route element={<ProtectedRoute role="school" />}>
        <Route path="/app" element={<DashboardLayout variant="school" />}>
          <Route index element={<SchoolDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="trainings" element={<TrainingsPage />} />
          <Route path="certifications" element={<CertificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
