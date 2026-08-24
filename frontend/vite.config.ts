import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Express backend stays exactly as-is. In dev, Vite proxies the API and
// runtime uploads to it so cookie auth (`credentials:'same-origin'`) keeps working.
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    // styles.css and the vendor scripts (marble/worldmap/map) are served
    // verbatim from /assets — Vite never processes them, guaranteeing parity.
    assetsInlineLimit: 0,
  },
})
