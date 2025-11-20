/**
 * Projects API Routes (mocked)
 * Covers routing without touching a real database
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock prisma used by the router via server import
const prismaMock = {
  project: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('../server.js', () => ({
  prisma: prismaMock,
}));

describe('Projects API (mocked)', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    const routerModule = await import('./projects.js');
    app = express();
    app.use(express.json());
    app.use('/api/projects', routerModule.default);
  });

  it('GET /api/projects should list projects', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Test Project',
        genre: 'rpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        _count: { versions: 2 },
      },
    ]);

    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.projects[0].id).toBe('p1');
    expect(prismaMock.project.findMany).toHaveBeenCalled();
  });

  it('POST /api/projects should create a project', async () => {
    prismaMock.project.create.mockResolvedValue({
      id: 'p2',
      name: 'New Project',
      genre: 'fps',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post('/api/projects').send({ name: 'New Project', genre: 'fps' });
    expect(res.status).toBe(201);
    expect(res.body.project.id).toBe('p2');
    expect(prismaMock.project.create).toHaveBeenCalled();
  });

  it('POST /api/projects should 400 on invalid body', async () => {
    const res = await request(app).post('/api/projects').send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('GET /api/projects/:id should 404 when missing', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/projects/missing');
    expect(res.status).toBe(404);
  });

  it('GET /api/projects/:id should return project with versions', async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: 'p3',
      name: 'Detail Project',
      genre: 'rpg',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      versions: [
        { id: 'v1', version: 1, title: '', mechanics: {}, lore: {}, metadata: {}, createdAt: new Date('2024-01-01') },
      ],
    });
    const res = await request(app).get('/api/projects/p3');
    expect(res.status).toBe(200);
    expect(res.body.project.id).toBe('p3');
    expect(res.body.versions.length).toBe(1);
  });
});
