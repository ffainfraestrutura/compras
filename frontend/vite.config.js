import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import Pages from "vite-plugin-pages";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    Pages({
      dirs: "src/pages",
      extensions: ["tsx", "jsx"],
    }),
  ],
  server: {
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});