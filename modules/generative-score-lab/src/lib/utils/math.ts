/**
 * Mathematical utility functions
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  // Handle edge case: if input range is zero, return middle of output range
  if (inMax === inMin) {
    return (outMin + outMax) / 2;
  }
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Ease-in curve
 */
export function easeIn(t: number): number {
  return t * t;
}

/**
 * Ease-out curve
 */
export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Ease-in-out curve
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Exponential curve
 */
export function exponential(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

/**
 * Random number between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Pick random element from array
 * Throws error if array is empty
 */
export function randomChoice<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('Cannot pick random element from empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
}
