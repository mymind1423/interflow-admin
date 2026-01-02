// src/context/AdminAuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { adminApi } from "../api/adminApi";

const AdminAuthContext = createContext();

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      try {
        const data = await adminApi.getProfile();
        if ((data.USER_TYPE || data.userType || "").toLowerCase() !== "admin") {
          setAdmin(null);
          setError("Admin access required");
          return;
        }
        const token = await user.getIdToken();
        localStorage.setItem("adminToken", token);
        setAdmin({ ...data, token });
        setError("");
      } catch (err) {
        setError(err.message);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const refreshAdmin = async () => {
    try {
      const data = await adminApi.getProfile();
      setAdmin(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to refresh admin profile", err);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, error, refreshAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}