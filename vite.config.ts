import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: mode === 'development' ? 'localhost' : '::',
    port: 8080,
  },
  plugins: [
    react(),
    ...(mode === 'development' ? [
      (() => {
        try {
          return componentTagger();
        } catch (error) {
          console.warn('Failed to load componentTagger:', error);
          return null;
        }
      })()
    ].filter(Boolean) : []),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
}));
