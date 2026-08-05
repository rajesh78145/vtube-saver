import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

// ---------- Auth ----------
export const fetchVideoInfo = (url) => api.post("/video/info", { url });

export const downloadVideo = (url, formatId, downloadId, onProgress) =>
  api.post(
    "/video/download",
    { url, formatId, downloadId },
    {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percent);
        }
      },
    },
  );

// ---------- History ----------
export const getHistory = () => api.get("/history");
export const deleteHistoryRecord = (id) => api.delete(`/history/${id}`);

// ---------- Profile ----------
export const getProfile = () => api.get("/profile");
export const updateProfile = (data) => api.put("/profile", data);
export const changePassword = (data) => api.put("/profile/password", data);
export const changeEmailRequest = (data) =>
  api.post("/profile/change-email-request", data);
export const verifyEmailChange = (data) =>
  api.post("/profile/verify-email-change", data);
export const updateAvatar = (formData) =>
  api.put("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const requestSetPasswordOTP = () =>
  api.post("/profile/set-password-otp");
export const setPassword = (data) => api.post("/profile/set-password", data);
// ---------- Plans ----------
export const getPlans = () => api.get("/plans");
export const upgradePlan = (planId) => api.post("/plans/upgrade", { planId });
export const cancelDownload = (downloadId) =>
  api.post(`/video/cancel/${downloadId}`);
export default api;
