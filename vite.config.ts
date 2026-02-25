
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
      includeAssets: [
        'apple-touch-icon.png',
        'mask-icon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
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
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
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
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true, // Performance: Remove logs in prod
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom')) return 'vendor-routing';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-core';
            // UI/Animation — framer-motion + lucide in the same async chunk
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui';
            // Data/Auth layer
            if (id.includes('supabase')) return 'vendor-supabase';
            if (id.includes('zod')) return 'vendor-validation';
            if (id.includes('axios')) return 'vendor-http';
            if (id.includes('jsonwebtoken')) return 'vendor-auth-utils';
            if (id.includes('@prisma/client')) return 'vendor-data';
            // Monitoring — loaded last, non-blocking
            if (id.includes('@sentry')) return 'vendor-monitoring';
            return 'vendor-misc';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    // Default to loopback for stability in sandboxed environments; opt-in to LAN binding.
    host: String(process.env.VITE_BIND_ALL || '').trim().toLowerCase() === 'true'
      ? true
      : (process.env.VITE_DEV_HOST || '127.0.0.1'),
    proxy: {
      '/api': {
        // Allow QA to run backend on a dedicated port to avoid conflicts (EADDRINUSE)
        // and avoid IPv6 localhost resolution issues by using 127.0.0.1.
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
