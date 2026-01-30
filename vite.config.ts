
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Enterprise Configuration: Base '/' for Vercel Root Deployment
  base: '/', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Viva360 - Ecossistema Holístico',
        short_name: 'Viva360',
        description: 'Plataforma completa para bem-estar e gestão holística',
        theme_color: '#263732',
        background_color: '#f4f7f5',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3209/3209931.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3209/3209931.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3209/3209931.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false, // Security: Hide source code in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Performance: Remove logs in prod
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          core: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          utils: ['axios', 'zod', 'date-fns'] // Assuming date-fns might be used or just standard utils
        },
      },
    },
  },
  server: {
    host: true
  }
})
