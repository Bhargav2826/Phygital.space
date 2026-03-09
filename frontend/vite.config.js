import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('lucide-react')) {
                            return 'ui-icons';
                        }
                        if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                            return 'charts';
                        }
                        if (id.includes('react-router-dom') || id.includes('@headlessui/react')) {
                            return 'vendor-ui';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    }
})
