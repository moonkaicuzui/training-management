import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/training-management/',
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
          // 차트 라이브러리
          'vendor-charts': ['recharts'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
          // 유틸리티
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // 아이콘
          'vendor-icons': ['lucide-react'],
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
      'recharts',
      'i18next',
      'react-i18next',
      'lucide-react',
      'date-fns',
    ],
  },
})
