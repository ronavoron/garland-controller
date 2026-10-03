import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // По умолчанию используем тестовый сервер
  let apiTarget = "http://localhost:8000";
  // Если запустили npm run dev:pi,
  // используем настоящий Raspberry Pi
  if (mode === "pi") {
    apiTarget = "http://192.168.1.199:8000";
  }
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Grilyanda Controller",
          short_name: "Grilyanda",
          start_url: "/",
          display: "standalone",
          background_color: "#0b0d12",
          theme_color: "#0b0d12",
          icons: [
            {
              src: "/pwa-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});