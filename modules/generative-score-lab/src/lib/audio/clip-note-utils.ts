import type { Clip } from '@/types';
import { generateNotes } from '@/lib/generators/factory';
import { midiToNote } from '@/lib/theory/scales';
import { DEFAULT_BPM } from '@/lib/utils/constants';

/**
 * Returns Tone-friendly note data for a clip.
 * Prefers manual piano roll notes if they exist, otherwise falls back to the generator.
 */
export function getClipPlaybackNotes(
  clip: Clip,
  key: string,
  scale: string,
  bpm: number = DEFAULT_BPM
): Array<{ note: string; time: number; duration: number; velocity: number }> {
  if (clip.customNotes && clip.customNotes.length > 0) {
    const secondsPerBar = getSecondsPerBar(bpm);

    return clip.customNotes.map((customNote) => {
      const { note, octave } = midiToNote(customNote.pitch);
      return {
        note: `${note}${octave}`,
        time: customNote.time * secondsPerBar,
        duration: Math.max(customNote.duration * secondsPerBar, 0.0001),
        velocity: customNote.velocity ?? 0.8,
      };
    });
  }

  return generateNotes(clip.generator, key, scale, clip.lengthBars, bpm);
}

function getSecondsPerBar(bpm: number): number {
  const beatsPerBar = 4; // Assuming 4/4 time signature for now
  return (60 / bpm) * beatsPerBar;
}
