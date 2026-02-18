import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * 인증 플로우 E2E 테스트
 *
 * Tests cover:
 * - Login page rendering
 * - Email/Password login form
 * - Redirect to dashboard after auth
 * - Protected routes redirect to login
 * - Session persistence
 *
 * Note: The app uses VITE_DEV_AUTH_BYPASS=true in test mode,
 * which bypasses Firebase Auth for protected routes.
 * Login page tests work independently of bypass mode.
 */

test.describe('Login Page', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Login page should render with Q-TRAIN branding
    await expect(page.getByText('Q-TRAIN')).toBeVisible();
  });

  test('should display email and password input fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('required', '');

    // Password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should display login submit button', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Login button - matches i18n keys for ko/vi/en
    const loginButton = page.getByRole('button', {
      name: /login|로그인|đăng nhập/i,
    });
    await expect(loginButton).toBeVisible();
  });

  test('should disable login button when fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Submit button should be disabled when email/password are empty
    const loginButton = page.getByRole('button', {
      name: /login|로그인|đăng nhập/i,
    });
    await expect(loginButton).toBeDisabled();
  });

  test('should enable login button when both fields are filled', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in email and password
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('testpassword');

    // Submit button should now be enabled
    const loginButton = page.getByRole('button', {
      name: /login|로그인|đăng nhập/i,
    });
    await expect(loginButton).toBeEnabled();
  });

  test('should display Firebase branding', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Powered by Firebase')).toBeVisible();
  });

  test('should display company-only notice text', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // The login page shows company-only and support info text
    const infoText = page.locator('.text-muted-foreground');
    await expect(infoText.first()).toBeVisible();
  });

  test('should display GraduationCap icon', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // The GraduationCap icon is wrapped in a div with primary color
    const iconContainer = page.locator('.bg-primary\\/10');
    await expect(iconContainer).toBeVisible();
  });
});

test.describe('Authentication Redirect', () => {
  test('should redirect root path to dashboard in dev bypass mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // In dev bypass mode, root should redirect to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should access dashboard without login in dev bypass mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should see dashboard content (not redirected to login)
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test('should maintain access across page navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to programs
    await page.goto('/programs');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/programs');

    // Navigate to employees
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/employees');

    // Should not be redirected to login at any point
    expect(page.url()).not.toContain('/login');
  });
});

test.describe('Protected Routes', () => {
  test('should access programs page', async ({ page }) => {
    await page.goto('/programs');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/programs');
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test('should access employees page', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/employees');
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test('should access results page', async ({ page }) => {
    await page.goto('/results');
    await page.waitForLoadState('networkidle');

    // Results requires canEditResults permission; in bypass mode it should load
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test('should access retraining page', async ({ page }) => {
    await page.goto('/retraining');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/retraining');
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await page.waitForLoadState('networkidle');

    // Should show some content (404 page or redirect)
    const content = page.locator('#root');
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Session Persistence', () => {
  test('should persist state on page refresh', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still show dashboard content (not redirected to login)
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
    expect(page.url()).not.toContain('/login');
  });

  test('should not expose sensitive data in URL', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).not.toMatch(/token=|password=|secret=|key=|apiKey=/i);
  });
});

test.describe('User Profile Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display user avatar button in header', async ({ page }) => {
    // User menu trigger button exists in the header
    const userButton = page.locator('header button.rounded-full, header [aria-label]').last();
    await expect(userButton).toBeVisible();
  });

  test('should open user dropdown menu', async ({ page }) => {
    // Click user avatar/icon button (last button in header actions)
    const userButton = page.locator('header').getByRole('button').last();
    await userButton.click();
    await page.waitForTimeout(300);

    // Dropdown should appear with menu items
    const dropdownContent = page.locator('[role="menu"], [data-radix-popper-content-wrapper]');
    await expect(dropdownContent.first()).toBeVisible({ timeout: 5000 });
  });
});
