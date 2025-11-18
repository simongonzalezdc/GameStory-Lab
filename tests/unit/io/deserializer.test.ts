/**
 * Tests for project deserializer
 */

import { describe, it, expect, vi } from 'vitest';
import { deserializeProject } from '@/lib/io/deserializer';
import { errorHandler } from '@/lib/errors/error-handler';

describe('Deserializer', () => {
  describe('deserializeProject', () => {
    it('should deserialize valid JSON to project', () => {
      const validJSON = JSON.stringify({
        schemaVersion: '1.0.0',
        projectId: 'project-1',
        name: 'Test Project',
        bpm: 120,
        timeSignature: '4/4',
        defaultKey: 'C',
        defaultScale: 'major',
        scenes: [],
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
        },
      });

      const result = deserializeProject(validJSON);

      expect(result.name).toBe('Test Project');
      expect(result.bpm).toBe(120);
    });

    it('should deserialize project with scenes', () => {
      const validJSON = JSON.stringify({
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
      });

      const result = deserializeProject(validJSON);

      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].name).toBe('Scene 1');
    });

    it('should throw error for invalid JSON syntax', () => {
      const invalidJSON = '{ invalid json }';
      vi.spyOn(errorHandler, 'handle');

      expect(() => deserializeProject(invalidJSON)).toThrow('Invalid project JSON');
      expect(errorHandler.handle).toHaveBeenCalled();
    });

    it('should throw error for invalid project structure', () => {
      const invalidJSON = JSON.stringify({
        name: 'Test',
        // Missing required fields
      });
      vi.spyOn(errorHandler, 'handle');

      expect(() => deserializeProject(invalidJSON)).toThrow('Invalid project JSON');
    });

    it('should throw error for empty string', () => {
      vi.spyOn(errorHandler, 'handle');

      expect(() => deserializeProject('')).toThrow('Invalid project JSON');
      expect(errorHandler.handle).toHaveBeenCalled();
    });

    it('should deserialize project with tracks and clips', () => {
      const validJSON = JSON.stringify({
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
      });

      const result = deserializeProject(validJSON);

      expect(result.scenes[0].tracks).toHaveLength(1);
      expect(result.scenes[0].tracks[0].clips).toHaveLength(1);
    });

    it('should handle optional metadata fields', () => {
      const validJSON = JSON.stringify({
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
          author: 'Test Author',
          description: 'Test description',
          tags: ['test', 'music'],
        },
      });

      const result = deserializeProject(validJSON);

      expect(result.metadata.author).toBe('Test Author');
      expect(result.metadata.description).toBe('Test description');
      expect(result.metadata.tags).toEqual(['test', 'music']);
    });
  });
});
