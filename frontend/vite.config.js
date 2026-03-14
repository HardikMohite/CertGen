import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/session": "http://127.0.0.1:8000",
      "/upload": "http://127.0.0.1:8000",
      "/preview": "http://127.0.0.1:8000",
      "/generate": "http://127.0.0.1:8000",
      "/download": "http://127.0.0.1:8000",
      "/fonts": "http://127.0.0.1:8000",
      "/static/fonts": "http://127.0.0.1:8000",
    },
  },
});