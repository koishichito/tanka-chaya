import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const allowedHosts = new Set<string>(['localhost', '127.0.0.1']);

const hostEnvVars = ['RAILWAY_PUBLIC_DOMAIN', 'RAILWAY_STATIC_URL', 'CLIENT_URL'];

for (const envName of hostEnvVars) {
  const value = process.env[envName];
  if (!value) continue;

  try {
    const host = new URL(value.startsWith('http') ? value : `https://${value}`).host;
    if (host) {
      allowedHosts.add(host);
    }
  } catch {
    // ignore invalid URLs
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  preview: {
    port: Number.parseInt(process.env.PORT ?? '4173', 10),
    host: true,
    strictPort: true,
    allowedHosts: Array.from(allowedHosts)
  }
});
