import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    rollupOptions: { output: { manualChunks: { vendor: ["react", "react-dom"], motion: ["motion/react"] } } },
  },
});
