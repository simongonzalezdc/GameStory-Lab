/**
 * Tests for project serializer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeProject, validateProject } from '@/lib/io/serializer';
import type { Project } from '@/types';
import { errorHandler } from '@/lib/errors/error-handler';

describe('Serializer', () => {
  let mockProject: Project;

  beforeEach(() => {
    mockProject = {
      id: 'project-1',
      name: 'Test Project',
      bpm: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      key: 'C',
      scale: 'major',
      scenes: [
        {
          id: 'scene-1',
          name: 'Scene 1',
          bpm: 120,
          timeSignature: { numerator: 4, denominator: 4 },
          tracks: [],
        },
      ],
      metadata: {
        created: '2024-01-01T00:00:00.000Z',
        modified: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        author: 'Test Author',
      },
    };
  });

  describe('serializeProject', () => {
    it('should serialize project to JSON string', () => {
      const result = serializeProject(mockProject);

      expect(typeof result).toBe('string');
      expect(result).toContain('Test Project');
    });

    it('should create valid JSON', () => {
      const result = serializeProject(mockProject);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should preserve all project data', () => {
      const result = serializeProject(mockProject);
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('project-1');
      expect(parsed.name).toBe('Test Project');
      expect(parsed.bpm).toBe(120);
      expect(parsed.key).toBe('C');
      expect(parsed.scale).toBe('major');
    });

    it('should serialize scenes', () => {
      const result = serializeProject(mockProject);
      const parsed = JSON.parse(result);

      expect(parsed.scenes).toHaveLength(1);
      expect(parsed.scenes[0].name).toBe('Scene 1');
    });

    it('should serialize metadata', () => {
      const result = serializeProject(mockProject);
      const parsed = JSON.parse(result);

      expect(parsed.metadata.author).toBe('Test Author');
      expect(parsed.metadata.version).toBe('1.0.0');
    });

    it('should format JSON with indentation', () => {
      const result = serializeProject(mockProject);

      // Check that the JSON is pretty-printed with 2-space indentation
      expect(result).toContain('\n  ');
    });
  });

  describe('validateProject', () => {
    it('should validate a valid project (basic structure)', () => {
      const validProject = {
        schemaVersion: '1.0.0',
        projectId: 'project-1',
        name: 'Test',
        bpm: 120,
        timeSignature: '4/4',
        defaultKey: 'C',
        defaultScale: 'major',
        scenes: [],
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = validateProject(validProject);

      expect(result).toBe(true);
    });

    it('should validate a project with scenes', () => {
      const validProject = {
        schemaVersion: '1.0.0',
        projectId: 'project-1',
        name: 'Test',
        bpm: 120,
        timeSignature: '4/4',
        defaultKey: 'C',
        defaultScale: 'major',
        scenes: [
          {
            id: 'scene-1',
            name: 'Scene 1',
            key: 'C',
            scale: 'major',
            intensityRange: [0, 1],
            tracks: [],
            mappings: [],
          },
        ],
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = validateProject(validProject);

      expect(result).toBe(true);
    });

    it('should reject invalid project (missing required fields)', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidProject = {
        name: 'Test',
        // Missing required fields
      };

      const result = validateProject(invalidProject);

      expect(result).toBe(false);
      expect(errorHandler.handle).toHaveBeenCalled();
    });

    it('should reject project with invalid BPM', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidProject = {
        schemaVersion: '1.0.0',
        projectId: 'project-1',
        name: 'Test',
        bpm: -10, // Invalid: negative
        timeSignature: '4/4',
        defaultKey: 'C',
        defaultScale: 'major',
        scenes: [],
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = validateProject(invalidProject);

      expect(result).toBe(false);
      expect(errorHandler.handle).toHaveBeenCalled();
    });

    it('should reject non-object data', () => {
      vi.spyOn(errorHandler, 'handle');

      const result = validateProject('invalid');

      expect(result).toBe(false);
    });

    it('should reject null', () => {
      vi.spyOn(errorHandler, 'handle');

      const result = validateProject(null);

      expect(result).toBe(false);
    });

    it('should validate project with tracks and clips', () => {
      const validProject = {
        schemaVersion: '1.0.0',
        projectId: 'project-1',
        name: 'Test',
        bpm: 120,
        timeSignature: '4/4',
        defaultKey: 'C',
        defaultScale: 'major',
        scenes: [
          {
            id: 'scene-1',
            name: 'Scene 1',
            key: 'C',
            scale: 'major',
            intensityRange: [0, 1],
            tracks: [
              {
                id: 'track-1',
                role: 'drums',
                instrumentRef: 'drums',
                clips: [
                  {
                    id: 'clip-1',
                    lengthBars: 4,
                    generator: {
                      type: 'euclidean',
                      params: {},
                    },
                    muted: false,
                  },
                ],
                volume: 0.8,
                pan: 0,
                muted: false,
                solo: false,
              },
            ],
            mappings: [],
          },
        ],
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = validateProject(validProject);

      expect(result).toBe(true);
    });

    it('should reject track with invalid volume', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidProject = {
        schemaVersion: '1.0.0',
        projectId: 'project-1',
        name: 'Test',
        bpm: 120,
        timeSignature: '4/4',
        defaultKey: 'C',
        defaultScale: 'major',
        scenes: [
          {
            id: 'scene-1',
            name: 'Scene 1',
            key: 'C',
            scale: 'major',
            intensityRange: [0, 1],
            tracks: [
              {
                id: 'track-1',
                role: 'drums',
                instrumentRef: 'drums',
                clips: [],
                volume: 2.0, // Invalid: > 1
                pan: 0,
                muted: false,
                solo: false,
              },
            ],
            mappings: [],
          },
        ],
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = validateProject(invalidProject);

      expect(result).toBe(false);
    });
  });
});
