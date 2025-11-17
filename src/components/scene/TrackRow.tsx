import { useState } from 'react';
import { useProjectStore } from '@/stores/project-store';
import type { Track } from '@/types';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import ClipList from './ClipList';
import { exportTrackToMidi } from '@/lib/io/midi-export';

interface TrackRowProps {
  sceneId: string;
  track: Track;
}

export default function TrackRow({ sceneId, track }: TrackRowProps) {
  const { project, updateTrack, deleteTrack } = useProjectStore();
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);

  const scene = project?.scenes.find((s) => s.id === sceneId);

  const handleExportMidi = async () => {
    if (!scene) return;

    try {
      setExporting(true);
      await exportTrackToMidi(scene, track.id);
    } catch (error) {
      console.error('Failed to export track:', error);
      alert('Failed to export MIDI file');
    } finally {
      setExporting(false);
    }
  };

  const roleIcons: Record<string, string> = {
    drums: '🥁',
    bass: '🎸',
    pad: '🎹',
    lead: '🎺',
    fx: '✨',
    other: '🎵',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Track Header */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl">{roleIcons[track.role] || '🎵'}</span>
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
              onClick={() => {
                if (confirm(`Delete track "${track.name}"?`)) {
                  deleteTrack(sceneId, track.id);
                }
              }}
              className="text-red-600"
              title="Delete track"
            >
              🗑
            </Button>
          </div>
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
  );
}
