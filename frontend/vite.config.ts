import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
    plugins: [
        react(),
        istanbul({
            include: 'src/*',
            exclude: ['node_modules', 'test/', 'cypress/', '**/*.test.tsx', '**/*.test.ts'],
            extension: ['.js', '.ts', '.tsx'],
            cypress: true,
            requireEnv: false,
            forceBuildInstrument: process.env.VITE_COVERAGE === 'true',
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: ['deti-tqs-21.ua.pt'],
        proxy: {
            '/api': {
                target: 'http://backend:8081',
                changeOrigin: true,
                secure: false,
            }
        }
    }
});
