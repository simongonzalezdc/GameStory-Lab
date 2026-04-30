/**
 * Fast deep equality checking optimized for Project objects
 * Much faster than JSON.stringify comparison
 */

/**
 * Fast deep equality check for objects and arrays
 * Optimized for performance over JSON.stringify
 */
export function fastDeepEqual(a: any, b: any): boolean {
  // Identical reference
  if (a === b) return true;

  // Both null or undefined
  if (a == null || b == null) return a === b;

  // Different types
  if (typeof a !== typeof b) return false;

  // Primitives
  if (typeof a !== 'object') return a === b;

  // Arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!fastDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Objects
  if (Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!fastDeepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Simple hash function for objects (FNV-1a hash)
 * Returns a number hash of the object
 */
export function hashObject(obj: any): number {
  const str = JSON.stringify(obj);
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash *= 16777619; // FNV prime
    // Keep hash as 32-bit integer
    hash = hash >>> 0;
  }

  return hash;
}

/**
 * Fast equality check using hash comparison first, then deep equality
 * This provides the best of both worlds for large objects
 */
export function fastEqualWithHash(a: any, b: any): boolean {
  // Quick reference check
  if (a === b) return true;
  if (a == null || b == null) return false;

  // For large objects, use hash first as quick rejection test
  // Only do deep comparison if hashes match
  const hashA = hashObject(a);
  const hashB = hashObject(b);

  if (hashA !== hashB) return false;

  // Hash collision possible, do deep comparison
  return fastDeepEqual(a, b);
}
