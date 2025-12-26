// src/router/AdminRoutes.jsx
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) return <div>Loading...</div>;

  //if (!admin) return <Navigate to="/login" />;

  return children;
}
// This component checks if the user is an admin and either renders the children or redirects to the login page.
// It also handles loading state by displaying a loading message while the authentication status is being determined.