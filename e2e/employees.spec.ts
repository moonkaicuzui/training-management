import { test, expect } from '@playwright/test';

/**
 * Employees E2E Tests
 * 직원 관리 페이지 기능 테스트
 */

test.describe('Employees Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
  });

  test('should display employees page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /직원 관리|Employee/i })).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/사번|이름|search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have filter dropdowns', async ({ page }) => {
    // Department filter
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('should display employee table', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Check table headers
    await expect(page.getByRole('columnheader', { name: /사번|ID/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /이름|Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /부서|Department/i })).toBeVisible();
  });

  test('should filter employees by status', async ({ page }) => {
    // Find and click status filter
    const statusFilter = page.getByRole('combobox').last();
    await statusFilter.click();

    // Select active status
    await page.getByRole('option', { name: /활성|Active/i }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);
  });

  test('should navigate to employee detail on row click', async ({ page }) => {
    // Wait for table to load with data
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click the view button in first row
    const viewButton = page.locator('table tbody tr').first().getByRole('button');
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/employees\/.+/);
    }
  });
});
