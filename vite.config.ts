import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      routesDirectory: 'src/client/routes',
      generatedRouteTree: 'src/client/routeTree.gen.ts',
    }),
    react(),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // daisyui's package.json has "browser": "./daisyui.css", which causes
      // @tailwindcss/vite to try loading a .css file as an ESM module (fails).
      // Point the alias directly at the JS entrypoint to bypass browser-field resolution.
      daisyui: resolve(__dirname, 'node_modules/daisyui/index.js'),
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
