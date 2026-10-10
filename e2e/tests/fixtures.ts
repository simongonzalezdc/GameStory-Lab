import { Page, expect } from '@playwright/test';

/**
 * Hermetic API interception for the E2E suite.
 *
 * The frontend calls `${VITE_API_URL || http://localhost:3007}${endpoint}`.
 * We intercept every /api/* route and serve deterministic fixtures, so the
 * suite needs no backend, no Postgres, no AI keys, and no network.
 *
 * Fixture shapes mirror the real backend responses.
 */

const API_ORIGIN = 'http://localhost:3007';

export const fixtures = {
  health: {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    ai: {
      clients: [
        { name: 'Ollama', type: 'ollama', available: true },
        { name: 'OpenRouter', type: 'openrouter', available: false },
      ],
      currentHourCost: 0,
      costLimit: 5,
    },
  },
  projects: {
    projects: [
      {
        id: 'p1',
        name: 'Neon Drift',
        genre: 'rpg',
        createdAt: new Date(2026, 9, 1).toISOString(),
        updatedAt: new Date(2026, 9, 5).toISOString(),
        _count: { versions: 3 },
      },
      {
        id: 'p2',
        name: 'Hollow Signal',
        genre: 'horror',
        createdAt: new Date(2026, 8, 20).toISOString(),
        updatedAt: new Date(2026, 9, 2).toISOString(),
        _count: { versions: 1 },
      },
    ],
  },
  project: {
    project: { id: 'p1', name: 'Neon Drift', genre: 'rpg' },
    versions: [
      {
        id: 'v1',
        version: 1,
        title: 'Neon Drift — v1',
        mechanics: { coreLoop: 'Race, hack, escape before dawn' },
        lore: { setting: { location: 'Neo-Kowloon' } },
        metadata: { consistencyScore: 0.72 },
        createdAt: new Date(2026, 9, 1).toISOString(),
      },
    ],
  },
  templates: {
    genres: [
      { id: 'rpg', name: 'RPG', description: 'Role-playing adventure' },
      { id: 'fps', name: 'FPS', description: 'First-person shooter' },
      { id: 'puzzle', name: 'Puzzle', description: 'Puzzle game' },
    ],
  },
  rules: {
    rules: [
      { rule: 'player-abilities-match', category: 'mechanics-lore-alignment' },
      { rule: 'world-physics-consistency', category: 'world-physics' },
    ],
  },
};

export async function mockApi(page: Page): Promise<void> {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors() });
      return;
    }

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json;charset=utf-8',
        headers: cors(),
        body: JSON.stringify(body),
      });

    if (url.pathname === '/health') return json(fixtures.health);

    if (url.pathname === '/api/templates' && route.request().method() === 'GET') {
      return json(fixtures.templates);
    }
    if (url.pathname.startsWith('/api/templates/')) return json(fixtures.templates.genres[0]);
    if (url.pathname === '/api/validate/rules') return json(fixtures.rules);

    if (url.pathname === '/api/projects' && route.request().method() === 'GET') {
      return json(fixtures.projects);
    }
    if (url.pathname === '/api/projects' && route.request().method() === 'POST') {
      return json({ project: { id: 'new', name: 'Untitled', genre: 'rpg' } });
    }
    if (url.pathname.startsWith('/api/projects/')) {
      return json(fixtures.project);
    }

    // Unhandled API calls respond with an empty success so the UI renders.
    return json({});
  });
}

function cors(): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  };
}

/** Parse the localStorage shape the app persists. */
export async function seedAuthFreeState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* storage may be unavailable; ignore */
    }
  });
}
