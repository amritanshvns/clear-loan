import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@openloan/core-engine": fileURLToPath(new URL("../core-engine/src/index.ts", import.meta.url))
    }
  }
});
