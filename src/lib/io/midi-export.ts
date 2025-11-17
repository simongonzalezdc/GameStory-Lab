/**
 * MIDI export functionality
 * Converts scenes and tracks to MIDI format
 */

import { Midi } from '@tonejs/midi';
import type { Scene, Track, Clip } from '@/types';
import { generateNotes } from '@/lib/generators/factory';

/**
 * Export options for MIDI generation
 */
export interface MidiExportOptions {
  /** Export all tracks or specific tracks */
  trackIds?: string[];
  /** Filename prefix */
  filenamePrefix?: string;
  /** Whether to export as separate files per track */
  separateFiles?: boolean;
}

/**
 * Convert scene to MIDI and download
 */
export async function exportSceneToMidi(
  scene: Scene,
  options: MidiExportOptions = {}
): Promise<void> {
  const { trackIds, filenamePrefix, separateFiles = false } = options;

  // Filter tracks if specific IDs provided
  const tracksToExport = trackIds
    ? scene.tracks.filter((t) => trackIds.includes(t.id))
    : scene.tracks;

  if (separateFiles) {
    // Export each track as a separate MIDI file
    for (const track of tracksToExport) {
      const midi = createMidiFromTrack(scene, track);
      const filename = `${filenamePrefix || scene.name}_${track.name || track.role}.mid`;
      await downloadMidi(midi, filename);
    }
  } else {
    // Export all tracks in a single MIDI file
    const midi = createMidiFromScene(scene, tracksToExport);
    const filename = `${filenamePrefix || scene.name}.mid`;
    await downloadMidi(midi, filename);
  }
}

/**
 * Create MIDI object from entire scene with multiple tracks
 */
function createMidiFromScene(scene: Scene, tracks: Track[]): Midi {
  const midi = new Midi();

  // Set tempo (BPM)
  midi.header.setTempo(scene.bpm || 120);

  // Add each track
  tracks.forEach((track) => {
    if (track.muted) return;

    const midiTrack = midi.addTrack();
    midiTrack.name = track.name || track.role;

    // Set instrument (using General MIDI program numbers)
    midiTrack.channel = getChannelForRole(track.role);
    midiTrack.instrument.number = getInstrumentNumberForRole(track.role);

    // Add all clips from this track
    track.clips.forEach((clip) => {
      if (clip.muted) return;
      addClipToMidiTrack(midiTrack, clip, scene);
    });
  });

  return midi;
}

/**
 * Create MIDI object from a single track
 */
function createMidiFromTrack(scene: Scene, track: Track): Midi {
  const midi = new Midi();

  // Set tempo (BPM)
  midi.header.setTempo(scene.bpm || 120);

  // Add single track
  const midiTrack = midi.addTrack();
  midiTrack.name = track.name || track.role;
  midiTrack.channel = getChannelForRole(track.role);
  midiTrack.instrument.number = getInstrumentNumberForRole(track.role);

  // Add all clips from this track
  track.clips.forEach((clip) => {
    if (clip.muted) return;
    addClipToMidiTrack(midiTrack, clip, scene);
  });

  return midi;
}

/**
 * Add a clip's notes to a MIDI track
 */
function addClipToMidiTrack(midiTrack: any, clip: Clip, scene: Scene): void {
  const key = scene.key || 'C';
  const scale = scene.scale || 'major';
  const bpm = scene.bpm || 120;

  // Generate notes from the clip's generator
  const notes = generateNotes(clip.generator, key, scale, clip.lengthBars, bpm);

  // Convert to MIDI notes
  notes.forEach((note) => {
    // Calculate time offset for this clip
    const offset = clip.offset || 0;
    const offsetInSeconds = (offset * 4 * 60) / bpm; // offset in bars to seconds

    midiTrack.addNote({
      midi: noteNameToMidi(note.note),
      time: note.time + offsetInSeconds,
      duration: note.duration,
      velocity: note.velocity,
    });
  });
}

/**
 * Convert note name (e.g., "C4") to MIDI number
 */
function noteNameToMidi(noteName: string): number {
  const noteMap: { [key: string]: number } = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
  };

  // Parse note name (e.g., "C#4" -> note="C#", octave=4)
  const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) {
    console.warn(`Invalid note name: ${noteName}`);
    return 60; // Default to middle C
  }

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  return noteMap[note] + (octave + 1) * 12;
}

/**
 * Get MIDI channel for track role (drums on channel 10)
 */
function getChannelForRole(role: string): number {
  return role === 'drums' ? 9 : 0; // Channel 10 (index 9) for drums
}

/**
 * Get General MIDI instrument number for track role
 */
function getInstrumentNumberForRole(role: string): number {
  const instrumentMap: { [key: string]: number } = {
    drums: 0, // Drums use channel 10, instrument doesn't matter
    bass: 33, // Acoustic Bass
    pad: 89, // Pad 2 (warm)
    lead: 81, // Lead 2 (sawtooth)
    fx: 99, // FX 4 (atmosphere)
    other: 0, // Acoustic Grand Piano
  };

  return instrumentMap[role] || 0;
}

/**
 * Download MIDI file to user's computer
 */
async function downloadMidi(midi: Midi, filename: string): Promise<void> {
  // Convert MIDI to binary array
  const midiArray = midi.toArray();

  // Create blob
  const blob = new Blob([midiArray as any], { type: 'audio/midi' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export individual track as MIDI
 */
export async function exportTrackToMidi(
  scene: Scene,
  trackId: string,
  filename?: string
): Promise<void> {
  const track = scene.tracks.find((t) => t.id === trackId);
  if (!track) {
    throw new Error(`Track ${trackId} not found`);
  }

  const midi = createMidiFromTrack(scene, track);
  const exportFilename = filename || `${scene.name}_${track.name || track.role}.mid`;
  await downloadMidi(midi, exportFilename);
}
