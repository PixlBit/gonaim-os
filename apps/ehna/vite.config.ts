import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * في التطوير: الواجهة على 5174 والخادم على 8788، والوكيل يجعلهما أصلًا
 * واحدًا في نظر المتصفح. بذلك تعمل كوكي الجلسة `SameSite=Strict` محليًا
 * كما تعمل في النشر بالضبط — لا مسار خاص بالتطوير يُخفي مشكلة حقيقية.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { "/api": { target: "http://localhost:8788", changeOrigin: false } },
  },
  build: { target: "es2022" },
});
