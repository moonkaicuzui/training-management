/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.svg'],
      manifest: {
        name: 'Q-TRAIN - Training Management System',
        short_name: 'Q-TRAIN',
        description: 'HWK Vietnam QIP 교육 관리 시스템',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 캐싱 전략
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.cloudfunctions\.net\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cloud-functions-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10, // 10초 후 캐시 폴백
            },
          },
        ],
        // 오프라인 폴백
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__)/],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  // Firebase Hosting: use root path
  // GitHub Pages: use '/training-management/'
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 번들 분석을 위한 sourcemap (프로덕션에서는 비활성화 권장)
    sourcemap: false,
    // 청크 크기 경고 한도 (KB)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 수동 청크 분할로 번들 최적화
        manualChunks: {
          // React 코어
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI 라이브러리
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
          ],
          // 차트 라이브러리는 LazyCharts에서 동적 import로 처리
          // 'vendor-charts': ['recharts'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
          // 유틸리티
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // 아이콘
          'vendor-icons': ['lucide-react'],
          // Firebase (별도 청크로 분리하여 초기 로딩 최적화)
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          // 상태 관리
          'vendor-state': ['zustand', 'immer'],
        },
      },
    },
    // 기본 esbuild 압축 사용 (terser보다 빠름)
    minify: 'esbuild',
  },
  // 개발 서버 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      // recharts는 LazyCharts에서 동적 import로 처리
      'i18next',
      'react-i18next',
      'lucide-react',
      'date-fns',
    ],
  },
})
