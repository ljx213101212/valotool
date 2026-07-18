import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/lineup-review': {
        target: 'http://localhost:5180',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/lineup-review/, '/api'),
      },
      '/work': {
        target: 'http://localhost:5180',
        changeOrigin: true,
      },
    },
  },
})