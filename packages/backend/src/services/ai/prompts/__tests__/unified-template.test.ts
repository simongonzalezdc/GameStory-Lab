/**
 * Tests for unified prompt template
 */

import { describe, it, expect } from 'vitest';
import {
  getUnifiedOutputFormatInstructions,
  getMinimaxOptimizationInstructions,
  getStrictJSONOutputRequirements,
  buildUnifiedPrompt,
} from '../unified-template.js';

describe('getUnifiedOutputFormatInstructions', () => {
  it('should return instruction block', () => {
    const result = getUnifiedOutputFormatInstructions();
    expect(result).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
    expect(result).toContain('Response Structure');
    expect(result).toContain('JSON Schema Compliance');
  });
});

describe('getMinimaxOptimizationInstructions', () => {
  it('should return mechanics-specific instructions', () => {
    const result = getMinimaxOptimizationInstructions('mechanics');
    expect(result).toContain('MINIMAX M2');
    expect(result).toContain('Coding-First Thinking');
  });

  it('should return lore-specific instructions', () => {
    const result = getMinimaxOptimizationInstructions('lore');
    expect(result).toContain('MINIMAX M2');
    expect(result).toContain('Character Psychology');
  });

  it('should return refinement-specific instructions', () => {
    const result = getMinimaxOptimizationInstructions('refinement');
    expect(result).toContain('MINIMAX M2');
    expect(result).toContain('Systems Thinking');
  });

  it('should return title-specific instructions', () => {
    const result = getMinimaxOptimizationInstructions('title');
    expect(result).toContain('MINIMAX M2');
    expect(result).toContain('Linguistic Analysis');
  });

  it('should return assistant-specific instructions', () => {
    const result = getMinimaxOptimizationInstructions('assistant');
    expect(result).toContain('MINIMAX M2');
    expect(result).toContain('Contextual Understanding');
  });
});

describe('getStrictJSONOutputRequirements', () => {
  it('should return strict output requirements', () => {
    const result = getStrictJSONOutputRequirements();
    expect(result).toContain('STRICT OUTPUT REQUIREMENTS');
    expect(result).toContain('Output ONLY the JSON object');
    expect(result).toContain('NO markdown code fences');
  });
});

describe('buildUnifiedPrompt', () => {
  it('should build a complete prompt for mechanics', () => {
    const prompt = buildUnifiedPrompt({
      taskType: 'mechanics',
      roleDescription: 'You are an expert game designer.',
      taskDescription: 'Generate game mechanics.',
      context: 'Genre: RPG',
      jsonSchema: '{"coreLoop": "string"}',
      additionalInstructions: 'Follow these principles.',
    });

    expect(prompt).toContain('expert game designer');
    expect(prompt).toContain('Generate game mechanics');
    expect(prompt).toContain('Genre: RPG');
    expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
    expect(prompt).toContain('STRICT OUTPUT REQUIREMENTS');
    expect(prompt).toContain('Coding-First Thinking');
  });

  it('should build a prompt without optional fields', () => {
    const prompt = buildUnifiedPrompt({
      taskType: 'lore',
      roleDescription: 'You are a narrative designer.',
      taskDescription: 'Generate lore.',
    });

    expect(prompt).toContain('narrative designer');
    expect(prompt).toContain('Generate lore');
    expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
  });

  it('should include all required sections', () => {
    const prompt = buildUnifiedPrompt({
      taskType: 'title',
      roleDescription: 'You are a marketing professional.',
      taskDescription: 'Generate titles.',
      context: 'Context here',
      jsonSchema: '{"titles": []}',
      additionalInstructions: 'Additional instructions.',
    });

    // Check that all sections are present
    expect(prompt).toContain('marketing professional');
    expect(prompt).toContain('Generate titles');
    expect(prompt).toContain('Context here');
    expect(prompt).toContain('{"titles": []}');
    expect(prompt).toContain('Additional instructions');
    expect(prompt).toContain('MINIMAX M2 OUTPUT FORMAT REQUIREMENTS');
    expect(prompt).toContain('STRICT OUTPUT REQUIREMENTS');
  });
});

