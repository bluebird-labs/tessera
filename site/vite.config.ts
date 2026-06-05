import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standalone marketing site. Built with esbuild (no in-browser transpile),
// production React, hashed asset filenames for long-term caching.
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: false,
  },
});
