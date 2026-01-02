import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * 대시보드 페이지 기능 테스트
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard title', async ({ page }) => {
    // Vietnamese: "Tổng quan" = Dashboard
    await expect(page.getByRole('heading', { name: /Tổng quan|대시보드|Dashboard/i })).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Wait for stats cards to load - look for card with specific content
    // Vietnamese: "Tổng nhân viên" = Total Employees
    await expect(page.getByText(/Tổng nhân viên|총 직원|Total Employees/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display monthly training chart', async ({ page }) => {
    // Vietnamese: "Thống kê theo tháng" = Monthly Chart
    await expect(page.getByText(/Thống kê theo tháng|월별 교육|Monthly/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display grade distribution', async ({ page }) => {
    // Vietnamese: "Phân bố xếp loại" = Grade Distribution
    await expect(page.getByText(/Phân bố xếp loại|등급 분포|Grade/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display retraining section', async ({ page }) => {
    // Vietnamese: "Đào tạo lại" = Retraining
    await expect(page.getByText(/Đào tạo lại|재교육|Retraining/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should have quick action buttons', async ({ page }) => {
    // Vietnamese: "Đăng ký đào tạo mới" = New Training button
    // Vietnamese: "Nhập kết quả" = Enter Results button
    const newTrainingBtn = page.getByRole('button', { name: /Đăng ký đào tạo mới|새 교육|New Training/i });
    const enterResultsBtn = page.getByRole('button', { name: /Nhập kết quả|결과 입력|Enter Results/i });

    // At least one of these should be visible
    const hasNewTraining = await newTrainingBtn.isVisible().catch(() => false);
    const hasEnterResults = await enterResultsBtn.isVisible().catch(() => false);

    expect(hasNewTraining || hasEnterResults).toBeTruthy();
  });
});
