import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/stores/project-store';
import type { Track } from '@/types';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import ClipList from './ClipList';
import InstrumentSelector from './InstrumentSelector';
import { exportTrackToMidi } from '@/lib/io/midi-export';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AlertDialog } from '../ui/AlertDialog';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

interface TrackRowProps {
  sceneId: string;
  track: Track;
}

const ROLE_ICONS: Record<string, string> = {
  drums: '🥁',
  bass: '🎸',
  pad: '🎹',
  lead: '🎺',
  fx: '✨',
  other: '🎵',
};

export default function TrackRow({ sceneId, track }: TrackRowProps) {
  const { project, updateTrack, deleteTrack } = useProjectStore();
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportError, setShowExportError] = useState(false);

  // Memoize scene lookup to avoid recalculation on every render
  const scene = useMemo(
    () => project?.scenes.find((s) => s.id === sceneId),
    [project?.scenes, sceneId]
  );

  const handleExportMidi = useCallback(async () => {
    if (!scene) return;

    try {
      setExporting(true);
      await exportTrackToMidi(scene, track.id);
    } catch (error) {
      errorHandler.handle(error, 'Track MIDI Export', ErrorSeverity.ERROR);
      setShowExportError(true);
    } finally {
      setExporting(false);
    }
  }, [scene, track.id]);

  return (
    <>
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Track"
        description={`Are you sure you want to delete "${track.name}"? This action cannot be undone.`}
        onConfirm={() => deleteTrack(sceneId, track.id)}
        confirmLabel="Delete"
        variant="danger"
      />
      <AlertDialog
        open={showExportError}
        onOpenChange={setShowExportError}
        title="Export Failed"
        description="Failed to export MIDI file. Please try again."
        variant="error"
      />
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Track Header */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl">{ROLE_ICONS[track.role] || '🎵'}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{track.name || `${track.role} Track`}</h4>
            <p className="text-sm text-gray-500">{track.clips.length} clips</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={track.muted ? 'secondary' : 'ghost'}
              onClick={() => updateTrack(sceneId, track.id, { muted: !track.muted })}
              title="Mute/Unmute"
            >
              {track.muted ? '🔇' : '🔊'}
            </Button>
            <Button
              size="sm"
              variant={track.solo ? 'primary' : 'ghost'}
              onClick={() => updateTrack(sceneId, track.id, { solo: !track.solo })}
              title="Solo"
            >
              S
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportMidi}
              disabled={exporting || track.clips.length === 0}
              title="Export track as MIDI"
            >
              {exporting ? '⏳' : '🎹'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              title="Show/Hide clips"
            >
              {expanded ? '▼' : '▶'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600"
              title="Delete track"
            >
              🗑
            </Button>
          </div>
        </div>

        {/* Instrument Selector */}
        <div className="mt-4">
          <InstrumentSelector
            sceneId={sceneId}
            trackId={track.id}
            role={track.role}
            currentInstrumentRef={track.instrumentRef}
          />
        </div>

        {/* Volume and Pan Controls */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Slider
            label="Volume"
            value={[track.volume * 100]}
            onValueChange={([v]) => updateTrack(sceneId, track.id, { volume: v / 100 })}
            min={0}
            max={100}
          />
          <Slider
            label="Pan"
            value={[(track.pan + 1) * 50]}
            onValueChange={([v]) => updateTrack(sceneId, track.id, { pan: (v / 50) - 1 })}
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Expanded: Clips */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <ClipList sceneId={sceneId} trackId={track.id} />
        </div>
      )}
      </div>
    </>
  );
}
