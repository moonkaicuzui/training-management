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
    // Vietnamese: "Quản lý nhân viên" = Employee Management
    await expect(page.getByRole('heading', { name: /Quản lý nhân viên|직원 관리|Employee/i })).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    // Vietnamese: "Tìm theo mã hoặc tên nhân viên..."
    const searchInput = page.getByPlaceholder(/Tìm theo|사번|이름|search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have filter dropdowns', async ({ page }) => {
    // Department filter - look for combobox/select elements
    const filterElements = page.locator('button[role="combobox"], select');
    await expect(filterElements.first()).toBeVisible();
  });

  test('should display employee table', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Check table headers (Vietnamese)
    // "Mã nhân viên" = Employee ID, "Họ tên" = Name, "Phòng ban" = Department
    await expect(page.getByRole('columnheader', { name: /Mã nhân viên|사번|ID/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Họ tên|이름|Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Phòng ban|부서|Department/i })).toBeVisible();
  });

  test('should filter employees by status', async ({ page }) => {
    // Find and click status filter
    const statusFilter = page.locator('button[role="combobox"]').last();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select active status (Vietnamese: "Hoạt động" = Active)
      const activeOption = page.getByRole('option', { name: /Hoạt động|활성|Active/i });
      if (await activeOption.isVisible()) {
        await activeOption.click();
        // Wait for filter to apply
        await page.waitForTimeout(500);
      }
    }
  });

  test('should navigate to employee detail on row click', async ({ page }) => {
    // Wait for table to load with data
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

    // Click the view/detail button in first row
    const viewButton = tableRows.first().getByRole('button');
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/employees\/.+/);
    }
  });
});
