import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'ACT Prep App',
        short_name: 'ACT Prep',
        description: '11-day ACT study plan with lessons, drills, and tracking.',
        theme_color: '#7b5cde',
        background_color: '#f5f7fa',
        display: 'standalone',
        icons: [
          { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
          { src: '/placeholder.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    target: 'es2019',
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
}));
