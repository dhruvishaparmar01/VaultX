import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'https://vaultx-1-4rxr.onrender.com';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true
        }
      }
    }
  };
});
