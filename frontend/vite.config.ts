import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend =  'http://backend:8080';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: backend,
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, '/api')
            }
        }
    }
});
