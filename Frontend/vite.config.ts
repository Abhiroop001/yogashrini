import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("react-icons")) return "vendor-icons";
            if (
              id.includes("react-dom") ||
              id.includes("react-router") ||
              /[\\/]react[\\/]/.test(id)
            ) {
              return "vendor-react";
            }
          }
          return undefined;
        },
      },
    },
  },
});
