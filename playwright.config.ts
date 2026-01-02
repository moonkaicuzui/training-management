import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Q-TRAIN 교육 관리 시스템 E2E 테스트 설정
 */
export default defineConfig({
  testDir: './e2e',
  // 테스트 실행 결과 파일
  outputDir: './test-results',
  // 전역 타임아웃
  timeout: 30000,
  // 예상 타임아웃
  expect: {
    timeout: 10000,
  },
  // 병렬 실행
  fullyParallel: true,
  // 재시도 횟수 (CI에서는 2회)
  retries: process.env.CI ? 2 : 0,
  // 워커 수
  workers: process.env.CI ? 1 : undefined,
  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  // 전역 설정
  use: {
    // Base URL (로컬 개발 서버)
    baseURL: 'http://localhost:5173',
    // 추적 설정
    trace: 'on-first-retry',
    // 스크린샷
    screenshot: 'only-on-failure',
    // 비디오 (실패 시)
    video: 'retain-on-failure',
    // 언어 설정
    locale: 'ko-KR',
    // 타임존
    timezoneId: 'Asia/Ho_Chi_Minh',
  },
  // 프로젝트 (브라우저) 설정
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 모바일 테스트
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // 개발 서버 설정 (인증 우회 모드로 실행)
  webServer: {
    command: 'VITE_DEV_AUTH_BYPASS=true npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_DEV_AUTH_BYPASS: 'true',
    },
  },
});
