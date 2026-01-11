// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRoute from "./router/AdminRoutes";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { Toaster } from "react-hot-toast";

import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/AdminDashboard";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminPlanning from "./pages/admin/AdminPlanning";
import LiveManager from "./pages/admin/LiveManager";
import AuditLogs from "./pages/admin/AuditLogs";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AdminNotificationProvider>
          <ThemeProvider>
            <ToastProvider>
              <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />
              <Routes>
                <Route path="/" element={<AdminLogin />} />
                <Route path="/login" element={<AdminLogin />} />

                <Route
                  path="/dashboard"
                  element={
                    <AdminRoute>
                      <Dashboard />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/companies"
                  element={
                    <AdminRoute>
                      <AdminCompanies />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/students"
                  element={
                    <AdminRoute>
                      <AdminStudents />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/applications"
                  element={
                    <AdminRoute>
                      <AdminApplications />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/planning"
                  element={
                    <AdminRoute>
                      <AdminPlanning />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/live-manager"
                  element={
                    <AdminRoute>
                      <LiveManager />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/logs"
                  element={
                    <AdminRoute>
                      <AuditLogs />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <AdminRoute>
                      <Reports />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <AdminRoute>
                      <Settings />
                    </AdminRoute>
                  }
                />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </AdminNotificationProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
