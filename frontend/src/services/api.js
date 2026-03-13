import axios from "axios";

// No .env in this project: use relative base URL so Vite dev proxy forwards
// requests to FastAPI. In production you can set VITE_API_URL.
const explicit = import.meta.env.VITE_API_URL;
const baseURL = explicit && explicit.trim() ? explicit : "/";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createSession = () => api.post("/session/create");

export const uploadTemplate = (sessionId, file) => {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("file", file);
  return api.post("/upload/template", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadCsv = (sessionId, file) => {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("file", file);
  return api.post("/upload/csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadFont = (sessionId, file) => {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("file", file);
  return api.post("/upload/font", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const previewCertificate = (payload) =>
  api.post("/preview", payload, { responseType: "blob" });

export const generateCertificates = (payload) => api.post("/generate", payload);

export const downloadZip = (sessionId) =>
  api.get(`/download/${sessionId}`, {
    responseType: "blob",
    headers: { Accept: "application/zip" },
  });

export const getFonts = () => api.get("/fonts");

export const refreshFonts = async () => {
  const res = await getFonts();
  return res.data?.fonts ?? [];
};

export const getTemplateThumbnail = (sessionId) =>
  api.get(`/upload/template/thumbnail/${sessionId}`, { responseType: "blob" });
