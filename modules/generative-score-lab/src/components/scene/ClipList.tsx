import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { generatorPresets } from '@/lib/generators/presets';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { DEFAULT_CLIP_LENGTH_BARS, MAX_CLIPS_PER_TRACK } from '@/lib/utils/constants';
import type { GeneratorType } from '@/types';
import ClipPianoRoll from './ClipPianoRoll';

interface ClipListProps {
  sceneId: string;
  trackId: string;
}

const GENERATOR_OPTIONS = [
  { value: 'euclidean', label: 'Euclidean Rhythm' },
  { value: 'arp', label: 'Arpeggiator' },
  { value: 'markov', label: 'Markov Chain' },
  { value: 'randomWalk', label: 'Random Walk' },
];

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

export default function ClipList({ sceneId, trackId }: ClipListProps) {
  const { project, addClip, deleteClip } = useProjectStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clipToDelete, setClipToDelete] = useState<string | null>(null);
  const [generatorType, setGeneratorType] = useState<GeneratorType>('euclidean');
  const [lengthBars, setLengthBars] = useState(DEFAULT_CLIP_LENGTH_BARS);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [usePreset, setUsePreset] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Memoize scene and track lookups
  const scene = useMemo(
    () => project?.scenes.find(s => s.id === sceneId),
    [project?.scenes, sceneId]
  );

  const track = useMemo(
    () => scene?.tracks.find(t => t.id === trackId),
    [scene?.tracks, trackId]
  );
  const trackClips = track?.clips ?? [];
  const sceneKey = scene?.key || project?.defaultKey || 'C';
  const sceneScale = scene?.scale || project?.defaultScale || 'major';
  const sceneBpm = scene?.bpm || project?.bpm;

  const handleAddClip = useCallback(() => {
    setValidationError('');

    // Validate clip length
    if (!lengthBars || lengthBars < 1 || lengthBars > 128) {
      setValidationError('Clip length must be between 1 and 128 bars');
      errorHandler.handle(
        new Error('Invalid clip length'),
        'Clip Validation',
        ErrorSeverity.WARNING
      );
      return;
    }

    // Validate track clip limit
    if (track && trackClips.length >= MAX_CLIPS_PER_TRACK) {
      setValidationError(`Maximum ${MAX_CLIPS_PER_TRACK} clips per track`);
      errorHandler.handle(
        new Error(`Track already has maximum number of clips (${MAX_CLIPS_PER_TRACK})`),
        'Clip Validation',
        ErrorSeverity.WARNING
      );
      return;
    }

    let generatorConfig;
    
    if (usePreset && selectedPreset) {
      const preset = generatorPresets.find(p => p.id === selectedPreset);
      if (preset) {
        generatorConfig = preset.config;
      } else {
        // Fallback to default
        generatorConfig = {
          type: generatorType,
          params: getDefaultParams(generatorType),
        };
      }
    } else {
      generatorConfig = {
        type: generatorType,
        params: getDefaultParams(generatorType),
      };
    }

    addClip(sceneId, trackId, {
      lengthBars,
      generator: generatorConfig,
      muted: false,
    });

    setShowAddDialog(false);
    setUsePreset(false);
    setSelectedPreset('');
    setLengthBars(DEFAULT_CLIP_LENGTH_BARS);
  }, [generatorType, lengthBars, addClip, sceneId, trackId, usePreset, selectedPreset, track, trackClips.length]);

  const handleDeleteClick = useCallback((clipId: string) => {
    setClipToDelete(clipId);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (clipToDelete) {
      deleteClip(sceneId, trackId, clipToDelete);
      setClipToDelete(null);
    }
  }, [clipToDelete, deleteClip, sceneId, trackId]);

  if (!track) return null;

  return (
    <>
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Clip"
        description="Are you sure you want to delete this clip? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        variant="danger"
      />
      <div>
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-900">Clips</h5>
        <Button 
          size="sm" 
          onClick={() => setShowAddDialog(true)} 
          data-tutorial="add-clip"
          aria-label="Add new clip to track"
        >
          + Add Clip
        </Button>
      </div>

      {trackClips.length === 0 ? (
        <p className="text-sm text-gray-500">No clips. Add a clip to start generating music!</p>
      ) : (
        <div 
          className="space-y-2"
          role="list"
          aria-label="Clip list"
        >
          {trackClips.map(clip => (
            <div 
              key={clip.id} 
              className="bg-white p-3 rounded border border-gray-200"
              role="listitem"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900" aria-label={`Clip: ${clip.generator.type} generator, ${clip.lengthBars} bars long`}>
                    {clip.generator.type} • {clip.lengthBars} bars
                  </p>
                </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(clip.id)}
                      className="text-red-600"
                      aria-label={`Delete clip: ${clip.generator.type} (${clip.lengthBars} bars)`}
                    >
                      🗑
                    </Button>
              </div>
              <ClipPianoRoll
                sceneId={sceneId}
                trackId={trackId}
                clip={clip}
                sceneKey={sceneKey}
                sceneScale={sceneScale}
                sceneBpm={sceneBpm}
              />
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-preset"
              checked={usePreset}
              onChange={(e) => {
                setUsePreset(e.target.checked);
                if (!e.target.checked) {
                  setSelectedPreset('');
                }
              }}
              className="rounded"
            />
            <label htmlFor="use-preset" className="text-sm font-medium text-gray-700">
              Use preset
            </label>
          </div>

          {usePreset ? (
            <Select
              label="Preset"
              value={selectedPreset}
              onValueChange={(v) => {
                setSelectedPreset(v);
                const preset = generatorPresets.find(p => p.id === v);
                if (preset) {
                  setGeneratorType(preset.config.type);
                }
              }}
              options={generatorPresets.map(p => ({
                value: p.id,
                label: `${p.name} (${p.category})`,
              }))}
            />
          ) : (
            <Select
              label="Generator Type"
              value={generatorType}
              onValueChange={(v) => setGeneratorType(v as GeneratorType)}
              options={GENERATOR_OPTIONS}
            />
          )}

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {validationError}
            </div>
          )}

          <Input
            label="Length (bars)"
            type="number"
            value={lengthBars}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                setLengthBars(Math.min(128, Math.max(1, value)));
              } else if (e.target.value === '') {
                setLengthBars(1);
              }
            }}
            min={1}
            max={128}
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
    </>
  );
}
