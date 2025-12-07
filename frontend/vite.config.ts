import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',  // IMPORTANTE para Docker
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://backend:8081',  // Corrigir porta
                changeOrigin: true,
                secure: false,
            }
        }
    }
});