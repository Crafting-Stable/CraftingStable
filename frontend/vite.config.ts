import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
    plugins: [
        react(),
        // Only instrument in development/test mode for coverage
        istanbul({
            include: 'src/*',
            exclude: ['node_modules', 'test/', 'cypress/', '**/*.test.tsx', '**/*.test.ts'],
            extension: ['.js', '.ts', '.tsx'],
            cypress: true,
            requireEnv: false,  // Always instrument (set to true to require VITE_COVERAGE=true)
            forceBuildInstrument: process.env.VITE_COVERAGE === 'true', // For production builds with coverage
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://backend:8081',
                changeOrigin: true,
                secure: false,
            }
        }
    }
});