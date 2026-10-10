import { test, expect } from '@playwright/test';
import { mockApi } from './fixtures';

/**
 * Critical journey: health page shows the AI provider availability
 * surfaced by the orchestrator.
 */
test.describe('Health monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test('reports database connectivity', async ({ page }) => {
    await page.goto('/health');
    await expect(page.getByText('connected', { exact: false }).first()).toBeVisible();
  });

  test('lists AI providers with availability', async ({ page }) => {
    await page.goto('/health');
    await expect(page.getByText('Ollama').first()).toBeVisible();
    await expect(page.getByText('OpenRouter').first()).toBeVisible();
  });
});
