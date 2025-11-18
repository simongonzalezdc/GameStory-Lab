/**
 * Health Check Endpoint Tests
 * Smoke tests for the health check endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server.js';
import { AIOrchestrator } from '../services/ai/orchestrator.js';

describe('Health Check Endpoint', () => {
  let aiOrchestrator: AIOrchestrator;

  beforeAll(async () => {
    // Initialize AI orchestrator
    aiOrchestrator = new AIOrchestrator();
    
    // Ensure database connection
    try {
      await prisma.$connect();
    } catch (error) {
      console.warn('Database connection failed in test setup:', error);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database successfully', async () => {
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  });

  it('should get AI orchestrator status', async () => {
    const status = await aiOrchestrator.getStatus();
    
    expect(status).toHaveProperty('clients');
    expect(status).toHaveProperty('currentHourCost');
    expect(status).toHaveProperty('costLimit');
    expect(Array.isArray(status.clients)).toBe(true);
  });
});

