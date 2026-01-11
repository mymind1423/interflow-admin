import { apiFetch } from "./client";

export const adminApi = {
  getProfile: () => apiFetch("/api/profile/get"),
  getStats: () => apiFetch("/api/admin/stats"),
  getAnalyticsReport: () => apiFetch("/api/admin/analytics"),
  getSettings: () => apiFetch("/api/admin/settings"),
  updateSettings: (settings) => apiFetch("/api/admin/settings", {
    method: "POST",
    body: JSON.stringify(settings)
  }),
  getStudents: () => apiFetch("/api/admin/students"),
  getCompanies: () => apiFetch("/api/admin/companies"),
  getJobs: () => apiFetch("/api/admin/jobs"),
  getPendingCompanies: () => apiFetch("/api/admin/companies/pending"),
  approveCompany: (id) => apiFetch("/api/admin/companies/approve", { method: "POST", body: JSON.stringify({ id }) }),
  rejectCompany: (id) => apiFetch("/api/admin/companies/reject", { method: "POST", body: JSON.stringify({ id }) }),
  deleteUser: (id) => apiFetch("/api/admin/users/delete", { method: "POST", body: JSON.stringify({ id }) }),
  getApplications: () => apiFetch("/api/admin/applications"),
  getNotifications: () => apiFetch("/api/notifications"),
  getInterviews: () => apiFetch("/api/admin/interviews"),
  getCompanyOffers: (id) => apiFetch(`/api/admin/companies/${id}/jobs`),
  getStudentApplications: (id) => apiFetch(`/api/admin/students/${id}/applications`),
  getStudentInterviews: (id) => apiFetch(`/api/admin/students/${id}/interviews`),
  sendInterviewReminder: (id) => apiFetch(`/api/admin/interviews/${id}/remind`, { method: "POST" }),
  getSettings: () => apiFetch("/api/admin/settings"),
  updateSetting: (key, value) => apiFetch("/api/admin/settings/update", { method: "POST", body: JSON.stringify({ key, value }) }),
  getLogs: () => apiFetch("/api/admin/logs"),
  updateAdminProfile: (displayName) => apiFetch("/api/admin/profile/update", { method: "POST", body: JSON.stringify({ displayName }) }),
  globalSearch: (q) => apiFetch(`/api/admin/search?q=${encodeURIComponent(q)}`),
  getLiveManagerData: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/live-manager?${query}`);
  },
  markNotificationRead: (id) => apiFetch(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => apiFetch(`/api/notifications/read-all`, { method: "PUT" })
};
