/**
 * Projects API Endpoint Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../server.js';
import projectsRouter from './projects.js';

const app = express();
app.use(express.json());
app.use('/api/projects', projectsRouter);

describe('Projects API', () => {
  let testProjectId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data
    if (testProjectId) {
      await prisma.project.delete({ where: { id: testProjectId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test projects
    await prisma.project.deleteMany({
      where: {
        name: {
          startsWith: 'Test Project',
        },
      },
    });
  });

  it('should create a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project',
        genre: 'rpg',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Project');
    expect(response.body.genre).toBe('rpg');

    testProjectId = response.body.id;
  });

  it('should return 400 for invalid project data', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        name: '', // Invalid: empty name
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('should list all projects', async () => {
    // Create a test project first
    const createResponse = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project List',
        genre: 'fps',
      });

    const response = await request(app).get('/api/projects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('projects');
    expect(Array.isArray(response.body.projects)).toBe(true);
    expect(response.body.projects.length).toBeGreaterThan(0);
  });

  it('should get a specific project by ID', async () => {
    // Create a test project first
    const createResponse = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project Get',
        genre: 'strategy',
      });

    const projectId = createResponse.body.id;

    const response = await request(app).get(`/api/projects/${projectId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(projectId);
    expect(response.body.name).toBe('Test Project Get');
  });

  it('should return 404 for non-existent project', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app).get(`/api/projects/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});

