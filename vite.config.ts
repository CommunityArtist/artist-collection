import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Check if SSL certificates exist
const keyPath = resolve(__dirname, 'localhost-key.pem');
const certPath = resolve(__dirname, 'localhost.pem');
const hasSSLCerts = existsSync(keyPath) && existsSync(certPath);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    ...(hasSSLCerts && {
      https: {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      },
    }),
    host: 'localhost',
    port: 5173,
  },
});