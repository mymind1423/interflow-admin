import { auth } from "../firebase";

const hostname = window.location.hostname;
const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${hostname}:5000`;

async function buildHeaders(customHeaders = {}, includeJson = true) {
  const token = (await auth.currentUser?.getIdToken?.()) || localStorage.getItem("adminToken");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const baseHeaders = includeJson ? { "Content-Type": "application/json" } : {};
  return {
    ...baseHeaders,
    ...authHeaders,
    ...customHeaders,
  };
}

export async function apiFetch(path, options = {}) {
  const headers = await buildHeaders(options.headers, !(options.body instanceof FormData));
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || "Request failed");
  }
  return body;
}
