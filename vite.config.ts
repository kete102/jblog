import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // ─── Dev server ─────────────────────────────────────────────────────────────
  // Vite runs on 5173; Hono API runs on 3000.
  // Proxy ensures browser cookies are forwarded correctly (credentials).

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/feed.xml': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // ─── Build ───────────────────────────────────────────────────────────────────
  // Output to dist/ so Hono can serve it in production via serveStatic.

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
