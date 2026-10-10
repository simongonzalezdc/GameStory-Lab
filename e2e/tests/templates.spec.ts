import { test, expect } from '@playwright/test';
import { mockApi, fixtures } from './fixtures';

/**
 * Critical journey: browse genre templates and open one.
 * Routes: /templates -> TemplateBrowserPage
 */
test.describe('Template browser', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('lists the genre templates returned by the API', async ({ page }) => {
    await page.goto('/templates');

    await expect(page.getByRole('heading', { name: /RPG/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /FPS/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Puzzle/i })).toBeVisible();
  });

  test('renders one heading per genre from the API', async ({ page }) => {
    await page.goto('/templates');
    // Auto-retrying locator, so no snapshot race against the fetch.
    for (const genre of fixtures.templates.genres) {
      await expect(page.getByRole('heading', { name: genre.name })).toBeVisible();
    }
  });

  test('shows the template preview panel', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /Template Preview/i })).toBeVisible();
  });
});
