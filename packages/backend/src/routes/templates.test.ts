/**
 * Templates API Routes Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import templatesRouter from './templates.js';

// Mock the template service
vi.mock('../services/templates/template-service.js', () => ({
  getTemplateService: vi.fn(() => ({
    getAvailableGenres: vi.fn().mockReturnValue(['rpg', 'fps', 'strategy']),
    getTemplate: vi.fn((genre: string) => {
      if (genre === 'rpg') {
        return {
          id: 'rpg',
          name: 'RPG Template',
          description: 'Role-playing game',
          mechanics: { coreLoop: 'rpg gameplay' },
          lore: { setting: { location: 'fantasy world' } },
          tags: ['rpg', 'fantasy'],
          difficulty: 'medium',
          targetAudience: 'everyone',
        };
      }
      return null;
    }),
    getTemplateStats: vi.fn((genre: string) => {
      if (genre === 'rpg') {
        return {
          genre: 'rpg',
          usageCount: 100,
          averageRating: 4.5,
        };
      }
      return null;
    }),
    customizeTemplate: vi.fn((genre: string, mechanicsOverrides, loreOverrides) => {
      if (genre === 'rpg') {
        return {
          mechanics: { coreLoop: 'customized rpg gameplay', ...mechanicsOverrides },
          lore: { setting: { location: 'custom world' }, ...loreOverrides },
        };
      }
      return null;
    }),
    blendGenres: vi.fn((genres: any[]) => {
      if (genres.length > 0) {
        return {
          id: 'blended',
          name: 'Blended Template',
          mechanics: { coreLoop: 'blended gameplay' },
          lore: { setting: { location: 'blended world' } },
        };
      }
      return null;
    }),
  })),
}));

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    project: {
      create: vi.fn().mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        genre: 'rpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
    version: {
      create: vi.fn().mockResolvedValue({
        id: 'version-123',
        projectId: 'project-123',
        version: 1,
        mechanics: {},
        lore: {},
        metadata: {},
        createdAt: new Date(),
      }),
    },
  },
}));

const app = express();
app.use(express.json());
app.use('/api/templates', templatesRouter);

describe('Templates API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/templates', () => {
    it('should list all available genres', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('genres');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.genres)).toBe(true);
      expect(response.body.genres).toContain('rpg');
      expect(response.body.count).toBe(3);
    });
  });

  describe('GET /api/templates/:genre', () => {
    it('should get a specific genre template', async () => {
      const response = await request(app).get('/api/templates/rpg');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('mechanics');
      expect(response.body).toHaveProperty('lore');
      expect(response.body.id).toBe('rpg');
    });

    it('should return 404 for non-existent genre', async () => {
      const response = await request(app).get('/api/templates/invalid');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/templates/:genre/stats', () => {
    it('should get template stats', async () => {
      const response = await request(app).get('/api/templates/rpg/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('genre');
      expect(response.body.genre).toBe('rpg');
    });

    it('should return 404 for non-existent genre stats', async () => {
      const response = await request(app).get('/api/templates/invalid/stats');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/templates/:genre/customize', () => {
    it('should customize a template', async () => {
      const response = await request(app)
        .post('/api/templates/rpg/customize')
        .send({
          mechanicsOverrides: { difficulty: 'hard' },
          loreOverrides: { theme: 'dark fantasy' },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('genre');
      expect(response.body).toHaveProperty('mechanics');
      expect(response.body).toHaveProperty('lore');
      expect(response.body).toHaveProperty('customized');
      expect(response.body.customized).toBe(true);
    });

    it('should return 404 for non-existent genre', async () => {
      const response = await request(app)
        .post('/api/templates/invalid/customize')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/templates/blend', () => {
    it('should blend multiple genres', async () => {
      const response = await request(app)
        .post('/api/templates/blend')
        .send({
          genres: [
            { genre: 'rpg', weight: 0.7 },
            { genre: 'fps', weight: 0.3 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('blended');
      expect(response.body).toHaveProperty('template');
      expect(response.body).toHaveProperty('sourceGenres');
      expect(response.body.blended).toBe(true);
    });

    it('should return 400 for missing genres array', async () => {
      const response = await request(app)
        .post('/api/templates/blend')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid genre config', async () => {
      const response = await request(app)
        .post('/api/templates/blend')
        .send({
          genres: [{ genre: 'rpg' }], // missing weight
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/templates/blend-and-create', () => {
    it('should blend genres and create project', async () => {
      const response = await request(app)
        .post('/api/templates/blend-and-create')
        .send({
          projectName: 'My Hybrid Game',
          genres: [
            { genre: 'rpg', weight: 0.7 },
            { genre: 'fps', weight: 0.3 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('blendedTemplate');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing project name', async () => {
      const response = await request(app)
        .post('/api/templates/blend-and-create')
        .send({
          genres: [{ genre: 'rpg', weight: 1.0 }],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('projectName');
    });

    it('should return 400 for missing genres', async () => {
      const response = await request(app)
        .post('/api/templates/blend-and-create')
        .send({
          projectName: 'Test',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/templates/:genre/create-project', () => {
    it('should create project from template', async () => {
      const response = await request(app)
        .post('/api/templates/rpg/create-project')
        .send({
          projectName: 'My RPG',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('message');
    });

    it('should create project with customizations', async () => {
      const response = await request(app)
        .post('/api/templates/rpg/create-project')
        .send({
          projectName: 'My Custom RPG',
          mechanicsOverrides: { difficulty: 'hard' },
          loreOverrides: { theme: 'dark' },
        });

      expect(response.status).toBe(201);
    });

    it('should return 400 for missing project name', async () => {
      const response = await request(app)
        .post('/api/templates/rpg/create-project')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('projectName');
    });

    it('should return 404 for non-existent genre', async () => {
      const response = await request(app)
        .post('/api/templates/invalid/create-project')
        .send({
          projectName: 'Test',
        });

      expect(response.status).toBe(404);
    });
  });
});
