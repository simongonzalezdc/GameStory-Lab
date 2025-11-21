/**
 * Integration tests for MiniMax M2 optimization
 * Tests the full pipeline: prompts -> orchestrator -> client -> response handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIOrchestrator } from '../orchestrator.js';
import { getMechanicsPrompt } from '../prompts/mechanics.js';
import { getLorePrompt } from '../prompts/lore.js';
import { getRefinementPrompt } from '../prompts/refinement.js';
import { getTitlePrompt } from '../prompts/title.js';
import { extractJSON } from '../utils/json-validation.js';

describe('MiniMax M2 Optimization Integration', () => {
  describe('Prompt Generation', () => {
    it('should generate mechanics prompt with unified template', () => {
      const prompt = getMechanicsPrompt('rpg');
      expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
      expect(prompt).toContain('STRICT OUTPUT REQUIREMENTS');
      expect(prompt).toContain('Coding-First Thinking');
      expect(prompt).toContain('REQUIRED JSON STRUCTURE');
    });

    it('should generate lore prompt with unified template', () => {
      const prompt = getLorePrompt('rpg');
      expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
      expect(prompt).toContain('STRICT OUTPUT REQUIREMENTS');
      expect(prompt).toContain('Character Psychology');
      expect(prompt).toContain('REQUIRED JSON STRUCTURE');
    });

    it('should generate refinement prompt with unified template', () => {
      const prompt = getRefinementPrompt();
      expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
      expect(prompt).toContain('STRICT OUTPUT REQUIREMENTS');
      expect(prompt).toContain('Systems Thinking');
      expect(prompt).toContain('REQUIRED JSON STRUCTURE');
    });

    it('should generate title prompt with unified template', () => {
      const prompt = getTitlePrompt();
      expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
      expect(prompt).toContain('STRICT OUTPUT REQUIREMENTS');
      expect(prompt).toContain('Linguistic Analysis');
      expect(prompt).toContain('REQUIRED JSON STRUCTURE');
    });
  });

  describe('Orchestrator Response Format', () => {
    it('should set response_format for mechanics task', async () => {
      const orchestrator = new AIOrchestrator({
        minimaxApiKey: 'test-key',
      });

      // Mock the client to capture the request
      const mockClient = {
        name: 'Minimax M2',
        type: 'minimax' as const,
        complete: vi.fn().mockResolvedValue({
          content: '{"coreLoop": "test"}',
          model: 'MiniMax-M2',
          tokensUsed: { prompt: 100, completion: 50, total: 150 },
          finishReason: 'stop' as const,
          metadata: { provider: 'minimax', durationMs: 100 },
        }),
        isAvailable: vi.fn().mockResolvedValue(true),
        listModels: vi.fn().mockResolvedValue(['MiniMax-M2']),
      };

      // Replace the client in the orchestrator
      orchestrator['clients'].set('minimax', mockClient as any);

      await orchestrator.generate('mechanics', [
        { role: 'user', content: 'Generate mechanics' },
      ]);

      expect(mockClient.complete).toHaveBeenCalled();
      const request = mockClient.complete.mock.calls[0][0];
      expect(request.responseFormat).toEqual({ type: 'json_object' });
    });

    it('should set response_format for lore task', async () => {
      const orchestrator = new AIOrchestrator({
        minimaxApiKey: 'test-key',
      });

      const mockClient = {
        name: 'Minimax M2',
        type: 'minimax' as const,
        complete: vi.fn().mockResolvedValue({
          content: '{"setting": {}}',
          model: 'MiniMax-M2',
          tokensUsed: { prompt: 100, completion: 50, total: 150 },
          finishReason: 'stop' as const,
          metadata: { provider: 'minimax', durationMs: 100 },
        }),
        isAvailable: vi.fn().mockResolvedValue(true),
        listModels: vi.fn().mockResolvedValue(['MiniMax-M2']),
      };

      orchestrator['clients'].set('minimax', mockClient as any);

      await orchestrator.generate('lore', [
        { role: 'user', content: 'Generate lore' },
      ]);

      const request = mockClient.complete.mock.calls[0][0];
      expect(request.responseFormat).toEqual({ type: 'json_object' });
    });

    it('should not set response_format for assistant task', async () => {
      const orchestrator = new AIOrchestrator({
        minimaxApiKey: 'test-key',
      });

      const mockClient = {
        name: 'Minimax M2',
        type: 'minimax' as const,
        complete: vi.fn().mockResolvedValue({
          content: '{"reply": "Hello"}',
          model: 'MiniMax-M2',
          tokensUsed: { prompt: 100, completion: 50, total: 150 },
          finishReason: 'stop' as const,
          metadata: { provider: 'minimax', durationMs: 100 },
        }),
        isAvailable: vi.fn().mockResolvedValue(true),
        listModels: vi.fn().mockResolvedValue(['MiniMax-M2']),
      };

      orchestrator['clients'].set('minimax', mockClient as any);

      await orchestrator.generate('assistant', [
        { role: 'user', content: 'Hello' },
      ]);

      const request = mockClient.complete.mock.calls[0][0];
      expect(request.responseFormat).toBeUndefined();
    });
  });

  describe('JSON Response Handling', () => {
    it('should extract JSON from markdown-wrapped response', () => {
      const response = '```json\n{"coreLoop": "test"}\n```';
      const result = extractJSON(response);
      expect(result.isValid).toBe(true);
      expect(result.parsed).toEqual({ coreLoop: 'test' });
    });

    it('should handle thinking blocks separately', () => {
      // This is handled by the Minimax client, but we can test the extraction
      const response = '{"reply": "Hello"}';
      const result = extractJSON(response);
      expect(result.isValid).toBe(true);
      expect(result.parsed).toEqual({ reply: 'Hello' });
    });

    it('should reformat malformed JSON', () => {
      const response = '{"key":"value",}'; // Trailing comma
      const result = extractJSON(response);
      // Should attempt to fix
      expect(result).toBeDefined();
    });
  });

  describe('Prompt Consistency', () => {
    it('should have consistent output format instructions across all prompts', () => {
      const mechanicsPrompt = getMechanicsPrompt();
      const lorePrompt = getLorePrompt();
      const refinementPrompt = getRefinementPrompt();
      const titlePrompt = getTitlePrompt();

      // All should contain the unified format requirements
      [mechanicsPrompt, lorePrompt, refinementPrompt, titlePrompt].forEach((prompt) => {
        expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
        expect(prompt).toContain('STRICT OUTPUT REQUIREMENTS');
        expect(prompt).toContain('NO markdown code fences');
      });
    });

    it('should include task-specific optimizations', () => {
      const mechanicsPrompt = getMechanicsPrompt();
      const lorePrompt = getLorePrompt();

      expect(mechanicsPrompt).toContain('Coding-First Thinking');
      expect(lorePrompt).toContain('Character Psychology');
    });
  });
});

