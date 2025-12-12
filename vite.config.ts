import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/gpg': {
        target: 'https://gpg-backend-vgrz.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gpg/, ''),
      },
      '/api/valesco': {
        target: 'https://backend.valescooil.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/valesco/, ''),
      },
    },
  },
})

