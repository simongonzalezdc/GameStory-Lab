/**
 * Template Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Genre } from '@gameforge/shared';

// Mock the filesystem operations
vi.mock('node:fs', () => ({
  default: {
    readFileSync: vi.fn((filePath: string) => {
      const genre = filePath.match(/\/([^/]+)\.json$/)?.[1];
      return JSON.stringify({
        id: genre,
        name: `${genre} Template`,
        description: `A ${genre} game template`,
        mechanics: { coreLoop: `${genre} gameplay` },
        lore: { setting: { location: `${genre} world` } },
        tags: [genre],
        difficulty: 'medium',
        targetAudience: 'everyone',
      });
    }),
  },
  readFileSync: vi.fn((filePath: string) => {
    const genre = filePath.match(/\/([^/]+)\.json$/)?.[1];
    return JSON.stringify({
      id: genre,
      name: `${genre} Template`,
      description: `A ${genre} game template`,
      mechanics: { coreLoop: `${genre} gameplay` },
      lore: { setting: { location: `${genre} world` } },
      tags: [genre],
      difficulty: 'medium',
      targetAudience: 'everyone',
    });
  }),
}));

// Import after mocking
const { TemplateService } = await import('./template-service.js');

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(() => {
    service = new TemplateService();
  });

  describe('Template Loading', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
    });

    it('should get template for valid genre', () => {
      const template = service.getTemplate('rpg');
      expect(template).toBeDefined();
    });

    it('should return null for invalid genre', () => {
      const template = service.getTemplate('invalid-genre' as Genre);
      expect(template).toBeNull();
    });

    it('should get blank template', () => {
      const template = service.getTemplate('blank');
      expect(template).toBeDefined();
      expect(template?.id).toBe('blank');
    });
  });

  describe('Template Properties', () => {
    it('should have required template properties', () => {
      const template = service.getTemplate('rpg');

      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('mechanics');
      expect(template).toHaveProperty('lore');
      expect(template).toHaveProperty('tags');
      expect(template).toHaveProperty('difficulty');
      expect(template).toHaveProperty('targetAudience');
    });

    it('should have mechanics data', () => {
      const template = service.getTemplate('fps');

      expect(template?.mechanics).toBeDefined();
      expect(typeof template?.mechanics).toBe('object');
    });

    it('should have lore data', () => {
      const template = service.getTemplate('strategy');

      expect(template?.lore).toBeDefined();
      expect(typeof template?.lore).toBe('object');
    });
  });

  describe('All Templates', () => {
    it('should list all templates', () => {
      const templates = service.getAllTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates with consistent structure', () => {
      const templates = service.getAllTemplates();

      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('mechanics');
        expect(template).toHaveProperty('lore');
        expect(template).toHaveProperty('tags');
      });
    });
  });

  describe('Genre Coverage', () => {
    const expectedGenres: Genre[] = [
      'rpg',
      'fps',
      'strategy',
      'puzzle',
      'survival',
      'action-adventure',
    ];

    expectedGenres.forEach((genre) => {
      it(`should have template for ${genre}`, () => {
        const template = service.getTemplate(genre);
        expect(template).toBeDefined();
        expect(template?.id).toBe(genre);
      });
    });
  });

  describe('Template Metadata', () => {
    it('should have difficulty rating', () => {
      const template = service.getTemplate('puzzle');
      expect(template?.difficulty).toBeDefined();
      expect(typeof template?.difficulty).toBe('string');
    });

    it('should have target audience', () => {
      const template = service.getTemplate('horror');
      expect(template?.targetAudience).toBeDefined();
      expect(typeof template?.targetAudience).toBe('string');
    });

    it('should have tags array', () => {
      const template = service.getTemplate('roguelike');
      expect(template?.tags).toBeDefined();
      expect(Array.isArray(template?.tags)).toBe(true);
    });
  });
});
