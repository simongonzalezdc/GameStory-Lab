import { useState } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import type { GeneratorType } from '@/types';

interface ClipListProps {
  sceneId: string;
  trackId: string;
}

export default function ClipList({ sceneId, trackId }: ClipListProps) {
  const { project, addClip, deleteClip } = useProjectStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [generatorType, setGeneratorType] = useState<GeneratorType>('euclidean');
  const [lengthBars, setLengthBars] = useState(4);

  const scene = project?.scenes.find(s => s.id === sceneId);
  const track = scene?.tracks.find(t => t.id === trackId);

  if (!track) return null;

  const generatorOptions = [
    { value: 'euclidean', label: 'Euclidean Rhythm' },
    { value: 'arp', label: 'Arpeggiator' },
    { value: 'markov', label: 'Markov Chain' },
    { value: 'randomWalk', label: 'Random Walk' },
  ];

  const handleAddClip = () => {
    const defaultParams = getDefaultParams(generatorType);

    addClip(sceneId, trackId, {
      lengthBars,
      generator: {
        type: generatorType,
        params: defaultParams,
      },
      muted: false,
    });

    setShowAddDialog(false);
  };

  const getDefaultParams = (type: GeneratorType) => {
    switch (type) {
      case 'euclidean':
        return { steps: 16, pulses: 4, rotation: 0, patternRole: 'kick' };
      case 'arp':
        return { mode: 'up', notesPerBeat: 2, octaveRange: 2, followChordProgression: false };
      case 'markov':
        return { order: 1, length: 16 };
      case 'randomWalk':
        return { stepSize: 2, stayInScale: true, length: 16 };
      default:
        return {};
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-900">Clips</h5>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          + Add Clip
        </Button>
      </div>

      {track.clips.length === 0 ? (
        <p className="text-sm text-gray-500">No clips. Add a clip to start generating music!</p>
      ) : (
        <div className="space-y-2">
          {track.clips.map(clip => (
            <div key={clip.id} className="bg-white p-3 rounded border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {clip.generator.type} • {clip.lengthBars} bars
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Delete clip?')) {
                      deleteClip(sceneId, trackId, clip.id);
                    }
                  }}
                  className="text-red-600"
                >
                  🗑
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Clip Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add Clip"
        description="Choose a generator and configure the clip"
      >
        <div className="space-y-4">
          <Select
            label="Generator Type"
            value={generatorType}
            onValueChange={(v) => setGeneratorType(v as GeneratorType)}
            options={generatorOptions}
          />

          <Input
            label="Length (bars)"
            type="number"
            value={lengthBars}
            onChange={(e) => setLengthBars(parseInt(e.target.value) || 4)}
            min={1}
            max={64}
          />

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="secondary" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClip}>
              Create Clip
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
