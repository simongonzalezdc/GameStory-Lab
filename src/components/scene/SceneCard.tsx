import type { Scene } from '@/types';
import { useProjectStore } from '@/stores/project-store';
import { Button } from '../ui/Button';

interface SceneCardProps {
  scene: Scene;
}

export default function SceneCard({ scene }: SceneCardProps) {
  const { setCurrentScene, deleteScene, duplicateScene } = useProjectStore();

  const handleDelete = () => {
    if (confirm(`Delete scene "${scene.name}"?`)) {
      deleteScene(scene.id);
    }
  };

  return (
    <div
      className="scene-card bg-white"
      style={{ borderColor: scene.color || '#ccc' }}
      data-tutorial="scene-card"
    >
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{scene.name}</h3>
          <div
            className="w-6 h-6 rounded-full border-2"
            style={{ backgroundColor: scene.color || '#ccc' }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {scene.key} {scene.scale}
          {scene.bpm && ` • ${scene.bpm} BPM`}
        </p>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p>{scene.tracks.length} track{scene.tracks.length !== 1 ? 's' : ''}</p>
        <p>Intensity: {(scene.intensityRange[0] * 100).toFixed(0)}% - {(scene.intensityRange[1] * 100).toFixed(0)}%</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCurrentScene(scene.id)}
          className="flex-1"
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => duplicateScene(scene.id)}
        >
          Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-red-600 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
