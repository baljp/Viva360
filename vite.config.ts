
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Use './' se for publicar em uma subpasta, ou '/' para o domínio principal
  base: '/', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
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
    sourcemap: true, // Habilitar sourcemaps para debug em produção
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react', 'framer-motion'],
        },
      },
    },
  },
  server: {
    host: true
  }
})
