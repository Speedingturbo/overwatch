import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
const backendProxy = {
    '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
    },
    '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
    }
}

export default defineConfig({
    base: './',
    plugins: [plugin()],
    server: {
        port: 54866,
        proxy: backendProxy
    },
    preview: {
        port: 4173,
        proxy: backendProxy
    }
})
