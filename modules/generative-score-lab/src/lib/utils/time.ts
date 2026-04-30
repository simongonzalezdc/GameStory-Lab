/**
 * Time conversion utilities
 */

/**
 * Convert bars to seconds
 */
export function barsToSeconds(bars: number, bpm: number, timeSignature = '4/4'): number {
  const [beatsPerBar] = timeSignature.split('/').map(Number);
  const beatsPerSecond = bpm / 60;
  const secondsPerBar = beatsPerBar / beatsPerSecond;
  return bars * secondsPerBar;
}

/**
 * Convert seconds to bars
 */
export function secondsToBars(seconds: number, bpm: number, timeSignature = '4/4'): number {
  const [beatsPerBar] = timeSignature.split('/').map(Number);
  const beatsPerSecond = bpm / 60;
  const secondsPerBar = beatsPerBar / beatsPerSecond;
  return seconds / secondsPerBar;
}

/**
 * Convert beats to bars
 */
export function beatsToBars(beats: number, timeSignature = '4/4'): number {
  const [beatsPerBar] = timeSignature.split('/').map(Number);
  return beats / beatsPerBar;
}

/**
 * Convert bars to beats
 */
export function barsToBeats(bars: number, timeSignature = '4/4'): number {
  const [beatsPerBar] = timeSignature.split('/').map(Number);
  return bars * beatsPerBar;
}
