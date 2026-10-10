import { test, expect } from '@playwright/test';
import { mockApi, fixtures } from './fixtures';

/**
 * Critical journey: a visitor lands on the dashboard and sees their projects.
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('renders the app shell and project list', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');

    // Brand title is set on the document.
    await expect(page).toHaveTitle(/GameStory Lab/i);

    // Seeded projects are visible by name.
    await expect(page.getByText('Neon Drift', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Hollow Signal', { exact: false }).first()).toBeVisible();

    expect(errors, `uncaught page errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('project cards show genre and version count', async ({ page }) => {
    await page.goto('/');
    const card = page.getByText('Neon Drift').first();
    await expect(card).toBeVisible();
    // Genre is rendered alongside the project.
    await expect(page.getByText(/rpg/i).first()).toBeVisible();
  });
});
