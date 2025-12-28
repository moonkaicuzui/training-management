import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * 기본 네비게이션 및 페이지 로딩 테스트
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Dev mode bypasses auth, so we can navigate directly
    await page.goto('/');
  });

  test('should redirect to dashboard from root', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Wait for sidebar to be visible
    await expect(page.locator('nav')).toBeVisible();

    // Check navigation items
    await expect(page.getByRole('link', { name: /대시보드|Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /교육 프로그램|Programs/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /진도 현황|Progress/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /교육 일정|Schedule/i })).toBeVisible();
  });

  test('should navigate to programs page', async ({ page }) => {
    await page.getByRole('link', { name: /교육 프로그램|Programs/i }).click();
    await expect(page).toHaveURL(/\/programs/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/교육 프로그램|Programs/i);
  });

  test('should navigate to progress page', async ({ page }) => {
    await page.getByRole('link', { name: /진도 현황|Progress/i }).click();
    await expect(page).toHaveURL(/\/progress/);
  });

  test('should navigate to employees page', async ({ page }) => {
    await page.getByRole('link', { name: /직원 관리|Employees/i }).click();
    await expect(page).toHaveURL(/\/employees/);
  });

  test('should navigate to retraining page', async ({ page }) => {
    await page.getByRole('link', { name: /재교육 대상|Retraining/i }).click();
    await expect(page).toHaveURL(/\/retraining/);
  });
});

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display Q-TRAIN logo', async ({ page }) => {
    await expect(page.getByText('Q-TRAIN')).toBeVisible();
  });

  test('should have global search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/검색|search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have language selector', async ({ page }) => {
    // Find the language/globe button
    const globeButton = page.getByRole('button', { name: /언어|language/i });
    await expect(globeButton).toBeVisible();

    // Click to open dropdown
    await globeButton.click();

    // Check language options
    await expect(page.getByText('Tiếng Việt')).toBeVisible();
    await expect(page.getByText('한국어')).toBeVisible();
    await expect(page.getByText('English')).toBeVisible();
  });
});
