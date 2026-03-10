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
        // 수동 청크 분할로 번들 최적화 (함수형: node_modules 경로 기반 매칭)
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // React 코어 (react-dom의 모든 서브모듈 포함)
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react-dom-')) return 'vendor-react';
          if (id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/scheduler/')) return 'vendor-react';

          // UI 라이브러리
          if (id.includes('node_modules/@radix-ui/')) return 'vendor-ui';

          // PDF 생성 (동적 import)
          if (id.includes('node_modules/jspdf')) return 'vendor-pdf';

          // Excel 처리 (동적 import)
          if (id.includes('node_modules/xlsx')) return 'vendor-excel';

          // PPT 생성
          if (id.includes('node_modules/pptxgenjs')) return 'vendor-pptx';

          // 캘린더
          if (id.includes('node_modules/react-big-calendar')) return 'vendor-calendar';

          // 폼 라이브러리
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform/') || id.includes('node_modules/zod')) return 'vendor-forms';

          // 테이블 라이브러리
          if (id.includes('node_modules/@tanstack/')) return 'vendor-table';

          // i18n
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'vendor-i18n';

          // 유틸리티
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge') || id.includes('node_modules/class-variance-authority')) return 'vendor-utils';

          // 아이콘
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';

          // Firebase
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) return 'vendor-firebase';

          // 상태 관리
          if (id.includes('node_modules/zustand')) return 'vendor-state';

          // 명령 팔레트
          if (id.includes('node_modules/cmdk')) return 'vendor-cmdk';

          return undefined;
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
