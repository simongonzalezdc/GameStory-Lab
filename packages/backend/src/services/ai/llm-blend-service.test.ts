/**
 * LLMBlendService — honest AI-enhancement reporting (defect D8, card t_4d397065)
 *
 * D8: /api/templates/blend-intelligent must not claim `enhanced:true` when the
 * AI enhancement did not actually happen. Two distinct failure modes are
 * covered here:
 *
 *  1. The AI call THROWS (daemon unreachable / model missing) → the mechanical
 *     blend is used and must be reported as NOT ai-enhanced.
 *  2. The AI call SUCCEEDS but the response carries no usable template
 *     fields → the mechanical blend is used and must also be reported as NOT
 *     ai-enhanced. (Regression guard: the parser used to back-fill base
 *     values, which made this case indistinguishable from a real enhancement.)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateCompletionMock } = vi.hoisted(() => ({
  generateCompletionMock: vi.fn(),
}));

vi.mock('./ai-service.js', () => ({
  AIService: class {},
  getAIService: () => ({
    generateCompletion: generateCompletionMock,
  }),
}));

vi.mock('../templates/template-service.js', () => ({
  TemplateService: class {
    getTemplate(genre: string) {
      return {
        id: genre,
        name: `${genre} template`,
        description: `${genre} description`,
        mechanics: { coreLoop: 'core loop' },
        lore: { setting: { location: 'somewhere' } },
        tags: [genre],
        difficulty: 'Medium',
        targetAudience: 'Everyone',
      };
    }
    blendGenres() {
      return null; // force the mechanical fallback template ('blank')
    }
  },
}));

import { LLMBlendService } from './llm-blend-service.js';

const GENRES = [
  { genre: 'rpg', weight: 0.6 },
  { genre: 'horror', weight: 0.4 },
];

const DESIGN_OPTIONS = {
  tone: 'balanced',
  complexity: 'medium',
  sessionLength: '20-40m',
};

describe('LLMBlendService.ai_enhanced honesty (D8, card t_4d397065)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports ai_enhanced:false when the AI call throws and the mechanical fallback runs', async () => {
    generateCompletionMock.mockRejectedValue(new Error('Ollama generation failed: model "qwen3:8b" not found'));

    const service = new LLMBlendService();
    const result = await service.blendGenresIntelligently(GENRES, DESIGN_OPTIONS);

    expect(result).not.toBeNull();
    expect(result!.ai_enhanced).toBe(false);
    expect(result!.template.id).toBe('blank');
    expect(result!.template.tags).not.toContain('ai-enhanced');
  });

  it('reports ai_enhanced:false when the AI response carries no usable template fields', async () => {
    // AI answered, but with a JSON object that has none of the template fields.
    generateCompletionMock.mockResolvedValue({ content: JSON.stringify({ note: 'no template here' }) });

    const service = new LLMBlendService();
    const result = await service.blendGenresIntelligently(GENRES, DESIGN_OPTIONS);

    expect(result).not.toBeNull();
    expect(result!.ai_enhanced).toBe(false);
    expect(result!.template.tags).not.toContain('ai-enhanced');
  });

  it('reports ai_enhanced:false when the AI response is not JSON at all', async () => {
    generateCompletionMock.mockResolvedValue({ content: 'I am sorry, I cannot help with that.' });

    const service = new LLMBlendService();
    const result = await service.blendGenresIntelligently(GENRES, DESIGN_OPTIONS);

    expect(result).not.toBeNull();
    expect(result!.ai_enhanced).toBe(false);
    expect(result!.template.tags).not.toContain('ai-enhanced');
  });

  it('reports ai_enhanced:true when the AI genuinely supplies an enhanced template', async () => {
    generateCompletionMock.mockResolvedValue({
      content: JSON.stringify({
        name: 'Nightfall RPG',
        description: 'A horror-infused RPG',
        mechanics: { coreLoop: 'investigate, then fight' },
        lore: { setting: { location: 'the drowned keep' } },
      }),
    });

    const service = new LLMBlendService();
    const result = await service.blendGenresIntelligently(GENRES, DESIGN_OPTIONS);

    expect(result).not.toBeNull();
    expect(result!.ai_enhanced).toBe(true);
    expect(result!.template.name).toBe('Nightfall RPG');
    expect(result!.template.tags).toContain('ai-enhanced');
  });
});
