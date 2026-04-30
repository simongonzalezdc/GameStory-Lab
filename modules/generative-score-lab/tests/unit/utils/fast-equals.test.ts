/**
 * Tests for fast equality checking utilities
 */

import { describe, it, expect } from 'vitest';
import { fastDeepEqual, hashObject } from '@/lib/utils/fast-equals';

describe('fastDeepEqual', () => {
  it('should return true for identical primitives', () => {
    expect(fastDeepEqual(1, 1)).toBe(true);
    expect(fastDeepEqual('test', 'test')).toBe(true);
    expect(fastDeepEqual(true, true)).toBe(true);
    expect(fastDeepEqual(null, null)).toBe(true);
    expect(fastDeepEqual(undefined, undefined)).toBe(true);
  });

  it('should return false for different primitives', () => {
    expect(fastDeepEqual(1, 2)).toBe(false);
    expect(fastDeepEqual('test', 'other')).toBe(false);
    expect(fastDeepEqual(true, false)).toBe(false);
    expect(fastDeepEqual(null, undefined)).toBe(false);
  });

  it('should return true for same reference', () => {
    const obj = { a: 1, b: 2 };
    expect(fastDeepEqual(obj, obj)).toBe(true);
  });

  it('should return true for deep equal objects', () => {
    const obj1 = { a: 1, b: { c: 2, d: 3 } };
    const obj2 = { a: 1, b: { c: 2, d: 3 } };
    expect(fastDeepEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for different objects', () => {
    const obj1 = { a: 1, b: { c: 2, d: 3 } };
    const obj2 = { a: 1, b: { c: 2, d: 4 } };
    expect(fastDeepEqual(obj1, obj2)).toBe(false);
  });

  it('should return true for deep equal arrays', () => {
    const arr1 = [1, 2, [3, 4]];
    const arr2 = [1, 2, [3, 4]];
    expect(fastDeepEqual(arr1, arr2)).toBe(true);
  });

  it('should return false for different arrays', () => {
    const arr1 = [1, 2, [3, 4]];
    const arr2 = [1, 2, [3, 5]];
    expect(fastDeepEqual(arr1, arr2)).toBe(false);
  });

  it('should return false for arrays with different lengths', () => {
    expect(fastDeepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('should handle complex nested structures', () => {
    const obj1 = {
      name: 'test',
      scenes: [
        { id: '1', tracks: [{ id: 't1', clips: [{ id: 'c1' }] }] },
        { id: '2', tracks: [{ id: 't2', clips: [{ id: 'c2' }] }] },
      ],
    };
    const obj2 = {
      name: 'test',
      scenes: [
        { id: '1', tracks: [{ id: 't1', clips: [{ id: 'c1' }] }] },
        { id: '2', tracks: [{ id: 't2', clips: [{ id: 'c2' }] }] },
      ],
    };
    expect(fastDeepEqual(obj1, obj2)).toBe(true);
  });

  it('should return false when object has different number of keys', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2, c: 3 };
    expect(fastDeepEqual(obj1, obj2)).toBe(false);
  });

  it('should handle null vs object', () => {
    expect(fastDeepEqual(null, {})).toBe(false);
    expect(fastDeepEqual({}, null)).toBe(false);
  });
});

describe('hashObject', () => {
  it('should return same hash for identical objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    expect(hashObject(obj1)).toBe(hashObject(obj2));
  });

  it('should return different hash for different objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    expect(hashObject(obj1)).not.toBe(hashObject(obj2));
  });

  it('should return a number', () => {
    const hash = hashObject({ test: 'value' });
    expect(typeof hash).toBe('number');
  });

  it('should handle complex objects', () => {
    const obj = {
      name: 'project',
      scenes: [{ id: '1' }, { id: '2' }],
      nested: { deep: { value: 42 } },
    };
    const hash = hashObject(obj);
    expect(typeof hash).toBe('number');
    expect(hash).toBeGreaterThan(0);
  });
});
