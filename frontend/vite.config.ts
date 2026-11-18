import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = process.env.VITE_API_PROXY ?? 'http://localhost:5000'

export default defineConfig(({ command, mode }) => ({
  // GitHub Pages serves the demo from /<repo>/ (set by the pages workflow)
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // Regular production builds fix the flag to false so the demo adapter is tree-shaken out.
  // (Not applied to dev/test, where VITE_DEMO is read at runtime.)
  define:
    command === 'build' && mode !== 'demo'
      ? { 'import.meta.env.VITE_DEMO': JSON.stringify('false') }
      : {},
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': { target: apiTarget, changeOrigin: true } },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
}))
