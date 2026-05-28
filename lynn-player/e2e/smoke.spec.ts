import { test, expect } from '@playwright/test';

test.describe('Lynn Player Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Lynn/);
  });

  test('should have main layout components', async ({ page }) => {
    await page.goto('/');
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
