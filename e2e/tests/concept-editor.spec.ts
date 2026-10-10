import { test, expect } from '@playwright/test';
import { mockApi } from './fixtures';

/**
 * Critical journey: open a project's concept editor and see the versioned
 * concept data that came back from the API.
 *
 * Route (App.tsx): /projects/:projectId -> ConceptEditorPage
 */
test.describe('Concept editor', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('renders the seeded version content', async ({ page }) => {
    await page.goto('/projects/p1');

    await expect(page.getByText('Neon Drift', { exact: false }).first()).toBeVisible();
    // The version's mechanics core loop comes straight from the API payload.
    await expect(page.getByText('Race, hack, escape before dawn').first()).toBeVisible();
  });
});
