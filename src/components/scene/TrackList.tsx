import { useMemo, useCallback } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { Button } from '../ui/Button';
import TrackRow from './TrackRow';
import type { TrackRole } from '@/types';

interface TrackListProps {
  sceneId: string;
}

export default function TrackList({ sceneId }: TrackListProps) {
  const { project, addTrack } = useProjectStore();

  // Memoize scene lookup
  const scene = useMemo(
    () => project?.scenes.find(s => s.id === sceneId),
    [project?.scenes, sceneId]
  );

  const handleAddTrack = useCallback((role: TrackRole) => {
    addTrack(sceneId, {
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} Track`,
      role,
      instrumentRef: 'default-synth',
      clips: [],
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
    });
  }, [addTrack, sceneId]);

  if (!scene) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tracks</h3>
        <div className="flex gap-2" data-tutorial="add-track">
          <Button size="sm" onClick={() => handleAddTrack('drums')} aria-label="Add drums track">+ Drums</Button>
          <Button size="sm" onClick={() => handleAddTrack('bass')} aria-label="Add bass track">+ Bass</Button>
          <Button size="sm" onClick={() => handleAddTrack('pad')} aria-label="Add pad track">+ Pad</Button>
          <Button size="sm" onClick={() => handleAddTrack('lead')} aria-label="Add lead track">+ Lead</Button>
        </div>
      </div>

      {scene.tracks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No tracks yet. Add a track to get started!</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => handleAddTrack('drums')} aria-label="Add drums track">Add Drums</Button>
            <Button onClick={() => handleAddTrack('bass')} aria-label="Add bass track">Add Bass</Button>
          </div>
        </div>
      ) : (
        <div 
          className="space-y-2"
          role="list"
          aria-label="Track list"
        >
          {scene.tracks.map(track => (
            <div key={track.id} role="listitem">
              <TrackRow sceneId={sceneId} track={track} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
