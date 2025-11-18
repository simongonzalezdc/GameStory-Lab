/**
 * Test Setup and Utilities
 * Provides mocks and utilities for testing
 */

import { vi } from 'vitest';

// Mock Prisma Client
export const mockPrisma = {
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  project: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  version: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  aiGeneration: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  validationResult: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
};

// Mock logger
export const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

// Sample test data
export const testData = {
  project: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    genre: 'rpg',
    userId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  mechanics: {
    coreLoop: 'Explore, fight, level up',
    playerActions: ['move', 'attack', 'use magic'],
    winConditions: ['defeat final boss'],
  },
  lore: {
    protagonist: {
      abilities: ['magic', 'combat'],
      motivation: 'Save the world',
    },
    conflict: {
      primary: 'Evil forces threaten the realm',
    },
    setting: {
      era: 'medieval fantasy',
      location: 'Kingdom of Eldoria',
    },
  },
};

// Helper to reset all mocks
export function resetAllMocks() {
  vi.clearAllMocks();
}
