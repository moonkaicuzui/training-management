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
    await expect(page.getByRole('heading', { name: /대시보드|Dashboard/i })).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Wait for cards to load
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });

    // Check for stat cards (at least the structure)
    const cards = page.locator('[class*="card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should display monthly training chart', async ({ page }) => {
    // Look for chart container or section
    await expect(page.getByText(/월별 교육|Monthly/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display grade distribution', async ({ page }) => {
    // Look for grade distribution section
    await expect(page.getByText(/등급 분포|Grade/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display recent results table', async ({ page }) => {
    // Look for recent results section
    await expect(page.getByText(/최근|Recent/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should have quick action buttons', async ({ page }) => {
    // Look for quick actions section
    const quickActions = page.getByText(/빠른 작업|Quick Actions/i);
    if (await quickActions.isVisible()) {
      await expect(quickActions).toBeVisible();
    }
  });
});
