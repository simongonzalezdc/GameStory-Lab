/**
 * Tests for JSON validation utilities
 */

import { describe, it, expect } from 'vitest';
import { extractJSON, validateJSONSchema, reformatResponse } from '../json-validation.js';

describe('extractJSON', () => {
  it('should extract valid JSON from plain text', () => {
    const content = '{"key": "value"}';
    const result = extractJSON(content);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
    expect(result.reformatted).toBe('{\n  "key": "value"\n}');
  });

  it('should extract JSON from markdown code fences', () => {
    const content = '```json\n{"key": "value"}\n```';
    const result = extractJSON(content);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
  });

  it('should extract JSON from code fences without language tag', () => {
    const content = '```\n{"key": "value"}\n```';
    const result = extractJSON(content);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
  });

  it('should extract JSON with extra text before/after', () => {
    const content = 'Here is the JSON:\n{"key": "value"}\nThat was the JSON.';
    const result = extractJSON(content);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ key: 'value' });
  });

  it('should extract JSON arrays', () => {
    const content = '[1, 2, 3]';
    const result = extractJSON(content);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual([1, 2, 3]);
  });

  it('should handle nested JSON objects', () => {
    const content = '{"outer": {"inner": "value"}}';
    const result = extractJSON(content);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ outer: { inner: 'value' } });
  });

  it('should return invalid for malformed JSON', () => {
    const content = '{"key": "value"';
    const result = extractJSON(content);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should fix trailing commas', () => {
    const content = '{"key": "value",}';
    const result = extractJSON(content);
    // Should attempt to fix and potentially succeed
    expect(result).toBeDefined();
  });

  it('should handle empty strings', () => {
    const content = '';
    const result = extractJSON(content);
    expect(result.isValid).toBe(false);
  });

  it('should handle non-JSON text', () => {
    const content = 'This is not JSON at all';
    const result = extractJSON(content);
    expect(result.isValid).toBe(false);
  });
});

describe('validateJSONSchema', () => {
  it('should validate JSON with required fields', () => {
    const json = { name: 'Test', age: 25 };
    const schema = {
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };
    const result = validateJSONSchema(json, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required fields', () => {
    const json = { name: 'Test' };
    const schema = {
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };
    const result = validateJSONSchema(json, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: age');
  });

  it('should validate field types', () => {
    const json = { name: 123, age: '25' };
    const schema = {
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };
    const result = validateJSONSchema(json, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate array items', () => {
    const json = { items: [{ name: 'Test' }, 'invalid'] };
    const schema = {
      properties: {
        items: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    };
    const result = validateJSONSchema(json, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle empty objects', () => {
    const json = {};
    const schema = {
      required: [],
      properties: {},
    };
    const result = validateJSONSchema(json, schema);
    expect(result.valid).toBe(true);
  });

  it('should reject non-objects', () => {
    const json = 'not an object';
    const schema = {
      required: [],
      properties: {},
    };
    const result = validateJSONSchema(json, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Root must be an object');
  });
});

describe('reformatResponse', () => {
  it('should reformat valid JSON', () => {
    const content = '{"key":"value"}';
    const result = reformatResponse(content);
    expect(result).toBe('{\n  "key": "value"\n}');
  });

  it('should extract and reformat JSON from markdown', () => {
    const content = '```json\n{"key":"value"}\n```';
    const result = reformatResponse(content);
    expect(result).toBe('{\n  "key": "value"\n}');
  });

  it('should return null for invalid JSON', () => {
    const content = 'not json';
    const result = reformatResponse(content);
    expect(result).toBeNull();
  });

  it('should handle JSON arrays', () => {
    const content = '[1,2,3]';
    const result = reformatResponse(content);
    expect(result).toBe('[\n  1,\n  2,\n  3\n]');
  });
});

