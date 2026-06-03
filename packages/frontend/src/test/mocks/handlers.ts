/**
 * MSW Request Handlers for API mocking
 */

import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3007';

export const handlers = [
  // Health check endpoint (note: /health not /api/health)
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      ai: {
        clients: [
          { name: 'OpenRouter', type: 'openrouter', available: true },
          { name: 'Ollama', type: 'ollama', available: true },
        ],
        currentHourCost: 0.0,
        costLimit: 5.0,
      },
    });
  }),

  // Get all projects
  http.get(`${API_BASE}/api/projects`, () => {
    return HttpResponse.json([
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Epic RPG Adventure',
        genre: 'rpg',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Space Shooter',
        genre: 'fps',
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
    ]);
  }),

  // Get single project
  http.get(`${API_BASE}/api/projects/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      name: 'Epic RPG Adventure',
      genre: 'rpg',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      concepts: [
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          projectId: id,
          version: 1,
          title: 'The Legend of Heroes',
          mechanics: {
            coreLoop: 'Explore dungeons, fight monsters, collect loot',
            playerActions: ['attack', 'defend', 'cast spell'],
          },
          lore: {
            setting: {
              era: 'Medieval Fantasy',
              location: 'Kingdom of Eldoria',
              worldType: 'High Fantasy',
            },
          },
          metadata: {
            aiModel: 'deepseek/deepseek-chat',
            consistencyScore: 0.85,
          },
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    });
  }),

  // Create project
  http.post(`${API_BASE}/api/projects`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: body.name,
        genre: body.genre || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Update project
  http.patch(`${API_BASE}/api/projects/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id,
      name: body.name || 'Updated Project',
      genre: body.genre || 'rpg',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    });
  }),

  // Delete project
  http.delete(`${API_BASE}/api/projects/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Get templates
  http.get(`${API_BASE}/api/templates`, () => {
    return HttpResponse.json([
      {
        genre: 'rpg',
        name: 'Role-Playing Game',
        description: 'Classic RPG template',
        mechanics: {
          coreLoop: 'Combat, exploration, progression',
        },
        lore: {
          setting: { worldType: 'Fantasy' },
        },
      },
      {
        genre: 'fps',
        name: 'First-Person Shooter',
        description: 'Fast-paced FPS template',
        mechanics: {
          coreLoop: 'Shoot, move, take cover',
        },
        lore: {
          setting: { worldType: 'Modern/Sci-Fi' },
        },
      },
    ]);
  }),

  // Get single template
  http.get(`${API_BASE}/api/templates/:genre`, ({ params }) => {
    const { genre } = params;
    return HttpResponse.json({
      genre,
      name: 'Role-Playing Game',
      description: 'Classic RPG template',
      mechanics: {
        coreLoop: 'Combat, exploration, progression',
      },
      lore: {
        setting: { worldType: 'Fantasy' },
      },
    });
  }),

  // Generate content
  http.post(`${API_BASE}/api/generate`, async () => {
    return HttpResponse.json({
      conceptId: '660e8400-e29b-41d4-a716-446655440001',
      content: {
        mechanics: {
          coreLoop: 'Generated mechanics content',
          playerActions: ['action1', 'action2'],
        },
        lore: {
          setting: {
            era: 'Generated era',
          },
        },
        title: 'Generated Title',
      },
      metadata: {
        model: 'deepseek/deepseek-chat',
        tokensUsed: 1500,
        durationMs: 2000,
        costUsd: 0.001,
      },
    });
  }),

  // Validate concept
  http.post(`${API_BASE}/api/validate`, async () => {
    return HttpResponse.json({
      validationId: '770e8400-e29b-41d4-a716-446655440001',
      issues: [
        {
          rule: 'mechanics-lore-alignment',
          severity: 'warning',
          confidence: 0.75,
          message: 'Mechanics and lore may have alignment issues',
          suggestion: 'Review the core loop alignment with world setting',
        },
      ],
      overallScore: 0.82,
    });
  }),
];
