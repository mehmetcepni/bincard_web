import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:8080/v1',
        changeOrigin: true,
        rewrite: (path) => `/api${path.replace(/^\/api/, '')}`
      }
    }
  }
})
