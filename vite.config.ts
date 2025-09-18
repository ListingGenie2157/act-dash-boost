import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const desiredPort = Number(process.env.PORT) || 8080;
  const desiredHost = process.env.HOST || "0.0.0.0";
  const useStrictPort = Boolean(process.env.PORT);

  return {
    server: {
      host: desiredHost,
      port: desiredPort,
      strictPort: useStrictPort,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
