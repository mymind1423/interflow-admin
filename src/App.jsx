// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRoute from "./router/AdminRoutes";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ToastProvider } from "./context/ToastContext";

import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/AdminDashboard";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminPlanning from "./pages/admin/AdminPlanning";
import LiveManager from "./pages/admin/LiveManager";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <ToastProvider>
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
              path="/settings"
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
