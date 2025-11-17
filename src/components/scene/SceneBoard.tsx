import { useProjectStore } from '@/stores/project-store';
import SceneCard from './SceneCard';
import { Button } from '../ui/Button';
import { DEFAULT_KEY, DEFAULT_SCALE, DEFAULT_INTENSITY_RANGE } from '@/lib/utils/constants';

export default function SceneBoard() {
  const { project, addScene } = useProjectStore();

  const handleCreateScene = () => {
    const sceneCount = project?.scenes.length || 0;
    addScene({
      name: `Scene ${sceneCount + 1}`,
      key: DEFAULT_KEY,
      scale: DEFAULT_SCALE,
      intensityRange: DEFAULT_INTENSITY_RANGE,
      tracks: [],
      mappings: [],
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Scenes</h2>
        <Button onClick={handleCreateScene} data-tutorial="add-scene">
          + Create Scene
        </Button>
      </div>

      {project.scenes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No scenes yet. Create your first scene to get started!</p>
          <Button onClick={handleCreateScene}>
            Create First Scene
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.scenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} />
          ))}
        </div>
      )}
    </div>
  );
}
