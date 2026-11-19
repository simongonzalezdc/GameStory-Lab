/**
 * Tests for the shared AI error envelope (defects D1/D7, card t_4d397065)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { extractErrorMessage, buildUserFriendlyAiErrorMessage, toAiErrorPayload } from './ai-error.js';

describe('extractErrorMessage', () => {
  it('uses Error.message for Error instances', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('uses message for plain AIClientError objects (the D1 "[object Object]" source)', () => {
    const plainObjectThrow = {
      name: 'AIClientError',
      message: 'Ollama generation failed: model "qwen3:8b" not found',
      provider: 'ollama',
      originalError: new Error('inner'),
    };
    expect(extractErrorMessage(plainObjectThrow)).toBe('Ollama generation failed: model "qwen3:8b" not found');
  });

  it('falls back to nested { error: { message } } wrappers', () => {
    expect(extractErrorMessage({ error: { message: 'nested failure' } })).toBe('nested failure');
  });

  it('stringifies other objects instead of returning [object Object]', () => {
    expect(extractErrorMessage({ code: 42 })).toBe('{"code":42}');
  });

  it('stringifies primitives', () => {
    expect(extractErrorMessage('nope')).toBe('nope');
    expect(extractErrorMessage(undefined)).toBe('undefined');
  });
});

describe('buildUserFriendlyAiErrorMessage', () => {
  it('gives actionable guidance naming providers for missing Ollama models', () => {
    const msg = buildUserFriendlyAiErrorMessage('Ollama generation failed: model "qwen3:8b" not found');
    expect(msg).toContain('ollama pull');
    expect(msg).toContain('OLLAMA_BASE_URL');
    expect(msg).toContain('MINIMAX_API_KEY');
    expect(msg).toContain('OLLAMA_AUTO_PULL=1');
  });

  it('never advises destructive pkill commands (D7)', () => {
    const cases = [
      'Ollama generation failed: model "qwen3:8b" not found',
      'Ollama model not accessible. Tried models: qwen3:4b',
      'No AI clients available. Please configure at least one AI provider.',
      'some unrelated failure',
    ];
    for (const c of cases) {
      expect(buildUserFriendlyAiErrorMessage(c).toLowerCase()).not.toContain('pkill');
    }
  });

  it('enumerates provider env vars when no AI clients are available', () => {
    const msg = buildUserFriendlyAiErrorMessage('No AI clients available. Please configure at least one AI provider.');
    expect(msg).toContain('MINIMAX_API_KEY');
    expect(msg).toContain('GLM_API_KEY');
    expect(msg).toContain('OPENROUTER_API_KEY');
    expect(msg).toContain('GOOGLE_API_KEY');
    expect(msg).toContain('ollama pull');
  });

  it('passes through unrelated messages unchanged', () => {
    expect(buildUserFriendlyAiErrorMessage('Version not found: abc')).toBe('Version not found: abc');
  });
});

describe('toAiErrorPayload', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns a flat { error, details } envelope in development', () => {
    process.env.NODE_ENV = 'development';
    const payload = toAiErrorPayload({
      name: 'AIClientError',
      message: 'Ollama generation failed: model "qwen3:8b" not found',
    });
    expect(payload.error).toBe(payload.error.trim());
    expect(payload.error).not.toBe('[object Object]');
    expect(payload.error).toContain('ollama pull');
    expect(payload.details).toBe('Ollama generation failed: model "qwen3:8b" not found');
  });

  it('omits details outside development', () => {
    process.env.NODE_ENV = 'production';
    const payload = toAiErrorPayload(new Error('secret internals'));
    expect(payload.error).toBe('secret internals');
    expect(payload.details).toBeUndefined();
  });
});
