import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { Clip, PianoRollNote } from '@/types';
import { useProjectStore } from '@/stores/project-store';
import { Button } from '../ui/Button';
import { getAudioEngine } from '@/lib/audio/engine';
import { midiToNote, noteNameToMidi } from '@/lib/theory/scales';
import { generateNotes } from '@/lib/generators/factory';
import { DEFAULT_BPM } from '@/lib/utils/constants';

interface ClipPianoRollProps {
  sceneId: string;
  trackId: string;
  clip: Clip;
  sceneKey: string;
  sceneScale: string;
  sceneBpm?: number;
}

interface GridPosition {
  pitch: number;
  step: number;
  time: number;
}

const MIDI_LOW = 48; // C3
const MIDI_HIGH = 84; // C6
const ROW_HEIGHT = 22;
const CELL_WIDTH = 26;
const STEPS_PER_BAR = 16;
const STEP_DURATION = 1 / STEPS_PER_BAR;
const DRAW_LENGTH_OPTIONS = [
  { id: '1/16', label: '1/16', steps: 1 },
  { id: '1/8', label: '1/8', steps: 2 },
  { id: '1/4', label: '1/4', steps: 4 },
  { id: '1/2', label: '1/2', steps: 8 },
];

export function ClipPianoRoll({
  sceneId,
  trackId,
  clip,
  sceneKey,
  sceneScale,
  sceneBpm,
}: ClipPianoRollProps) {
  const { updateClip } = useProjectStore();
  const manualNotes = useMemo(() => clip.customNotes ?? [], [clip.customNotes]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [lastCell, setLastCell] = useState<string | null>(null);
  const [noteLength, setNoteLength] = useState(DRAW_LENGTH_OPTIONS[0].steps);
  const [showPreview, setShowPreview] = useState(true);

  const bpm = sceneBpm || DEFAULT_BPM;
  const totalSteps = clip.lengthBars * STEPS_PER_BAR;
  const gridWidth = totalSteps * CELL_WIDTH;
  const midiRange = useMemo(() => {
    const values: number[] = [];
    for (let midi = MIDI_HIGH; midi >= MIDI_LOW; midi--) {
      values.push(midi);
    }
    return values;
  }, []);

  const pitchToRowIndex = useMemo(() => {
    const map = new Map<number, number>();
    midiRange.forEach((midi, index) => {
      map.set(midi, index);
    });
    return map;
  }, [midiRange]);

  const previewNotes = useMemo(() => {
    if (!showPreview) return [];

    try {
      const secondsPerBar = (60 / bpm) * 4;
      const generated = generateNotes(clip.generator, sceneKey || 'C', sceneScale || 'major', clip.lengthBars, bpm);
      return generated.map((note) => ({
        pitch: noteNameToMidi(note.note),
        time: note.time / secondsPerBar,
        duration: note.duration / secondsPerBar,
      }));
    } catch {
      return [];
    }
  }, [bpm, clip.generator, clip.lengthBars, sceneKey, sceneScale, showPreview]);

  const commitNotes = useCallback(
    (notes: PianoRollNote[]) => {
      updateClip(sceneId, trackId, clip.id, { customNotes: notes });
      getAudioEngine().rescheduleScene();
    },
    [clip.id, sceneId, trackId, updateClip]
  );

  const sortNotes = useCallback((notes: PianoRollNote[]) => {
    return [...notes].sort((a, b) => {
      if (a.time === b.time) {
        return a.pitch - b.pitch;
      }
      return a.time - b.time;
    });
  }, []);

  const removeNote = useCallback(
    (pitch: number, time: number) => {
      const updated = manualNotes.filter(
        (note) => !(note.pitch === pitch && Math.abs(note.time - time) < STEP_DURATION / 2)
      );
      commitNotes(updated);
    },
    [commitNotes, manualNotes]
  );

  const addNote = useCallback(
    (pitch: number, time: number) => {
      const duration = Math.min(noteLength * STEP_DURATION, clip.lengthBars - time);
      if (duration <= 0) return;

      const withoutExisting = manualNotes.filter(
        (note) => !(note.pitch === pitch && Math.abs(note.time - time) < STEP_DURATION / 2)
      );
      const updated: PianoRollNote[] = [
        ...withoutExisting,
        {
          id: crypto.randomUUID(),
          pitch,
          time,
          duration,
          velocity: 0.85,
        },
      ];
      commitNotes(sortNotes(updated));
    },
    [clip.lengthBars, commitNotes, manualNotes, noteLength, sortNotes]
  );

  const getGridPosition = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): GridPosition | null => {
      if (!gridRef.current) return null;
      const rect = gridRef.current.getBoundingClientRect();
      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      const scrollTop = scrollRef.current?.scrollTop ?? 0;

      const x = event.clientX - rect.left + scrollLeft;
      const y = event.clientY - rect.top + scrollTop;

      const clampedX = Math.max(0, Math.min(x, gridWidth - 1));
      const clampedY = Math.max(0, Math.min(y, midiRange.length * ROW_HEIGHT - 1));

      const step = Math.min(totalSteps - 1, Math.floor(clampedX / CELL_WIDTH));
      const row = Math.min(midiRange.length - 1, Math.floor(clampedY / ROW_HEIGHT));
      const pitch = midiRange[row] ?? MIDI_LOW;
      const time = step * STEP_DURATION;

      return { pitch, step, time };
    },
    [gridWidth, midiRange, totalSteps]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const position = getGridPosition(event);
      if (!position) return;

      const cellKey = `${position.pitch}-${position.step}`;
      setLastCell(cellKey);
      setIsPointerDown(true);

      const hasNote = manualNotes.some(
        (note) => note.pitch === position.pitch && Math.abs(note.time - position.time) < STEP_DURATION / 2
      );
      setEraseMode(hasNote);

      if (hasNote) {
        removeNote(position.pitch, position.time);
      } else {
        addNote(position.pitch, position.time);
      }
    },
    [addNote, getGridPosition, manualNotes, removeNote]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDown) return;
      const position = getGridPosition(event);
      if (!position) return;

      const cellKey = `${position.pitch}-${position.step}`;
      if (cellKey === lastCell) return;
      setLastCell(cellKey);

      if (eraseMode) {
        removeNote(position.pitch, position.time);
      } else {
        addNote(position.pitch, position.time);
      }
    },
    [addNote, eraseMode, getGridPosition, isPointerDown, lastCell, removeNote]
  );

  const handlePointerUp = useCallback(() => {
    setIsPointerDown(false);
    setEraseMode(false);
    setLastCell(null);
  }, []);

  const handleClear = useCallback(() => {
    commitNotes([]);
  }, [commitNotes]);

  const renderManualNotes = () => {
    return manualNotes.map((note) => {
      const rowIndex = pitchToRowIndex.get(note.pitch) ?? midiRange.length - 1;
      const top = rowIndex * ROW_HEIGHT + 2;
      const height = ROW_HEIGHT - 4;
      const width = Math.max((note.duration / STEP_DURATION) * CELL_WIDTH - 2, 6);
      const left = (note.time / STEP_DURATION) * CELL_WIDTH + 1;
      const label = midiToNote(note.pitch);

      return (
        <div
          key={note.id}
          className="absolute pointer-events-none flex items-center rounded-sm border border-blue-600 bg-blue-500/80 px-1 text-[10px] leading-none text-white"
          style={{ top, height, left, width }}
          aria-label={`Manual note ${label.note}${label.octave}`}
        >
          {label.note}
          <sub>{label.octave}</sub>
        </div>
      );
    });
  };

  const renderPreviewNotes = () => {
    if (!showPreview) return null;

    return previewNotes.map((note, index) => {
      const rowIndex = pitchToRowIndex.get(Math.round(note.pitch)) ?? midiRange.length - 1;
      const top = rowIndex * ROW_HEIGHT + 4;
      const height = ROW_HEIGHT - 8;
      const width = Math.max((note.duration / STEP_DURATION) * CELL_WIDTH - 4, 4);
      const left = (note.time / STEP_DURATION) * CELL_WIDTH + 2;
      return (
        <div
          key={`preview-${index}-${note.time}`}
          className="absolute rounded-sm bg-gray-400/50 pointer-events-none"
          style={{ top, height, left, width }}
          aria-hidden="true"
        />
      );
    });
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
        <div className="font-medium text-gray-800">Piano Roll</div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
            />
            <span>Generator preview</span>
          </label>
          <Button size="sm" variant="secondary" onClick={handleClear} disabled={manualNotes.length === 0}>
            Clear Roll
          </Button>
        </div>
      </div>

      <p className="mt-1 text-xs text-gray-500">
        Click and drag to draw or erase notes. Manual notes override the generator for this clip.
      </p>

      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
        <span>Note length:</span>
        <div className="flex rounded border border-gray-300 overflow-hidden">
          {DRAW_LENGTH_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setNoteLength(option.steps)}
              className={`px-2 py-1 text-xs ${
                noteLength === option.steps ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex rounded border border-gray-200 bg-white">
        <div className="flex flex-col border-r border-gray-200 bg-gray-50">
          {midiRange.map((midi) => {
            const label = midiToNote(midi);
            return (
              <div
                key={midi}
                className="flex h-[22px] items-center justify-center text-[10px] text-gray-600 uppercase"
                style={{ height: ROW_HEIGHT }}
              >
                {label.note}
                <sub>{label.octave}</sub>
              </div>
            );
          })}
        </div>
        <div className="relative flex-1 overflow-auto" ref={scrollRef}>
          <div
            ref={gridRef}
            className="relative"
            style={{
              width: gridWidth,
              height: midiRange.length * ROW_HEIGHT,
              backgroundImage:
                'linear-gradient(to right, rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.4) 1px, transparent 1px)',
              backgroundSize: `${CELL_WIDTH}px ${ROW_HEIGHT}px`,
              cursor: 'crosshair',
            }}
            role="grid"
            aria-label="Piano roll grid"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {renderPreviewNotes()}
            {renderManualNotes()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClipPianoRoll;
