import { useEffect } from 'react';
import { useProjectStore } from './stores/project-store';
import { useTutorialStore } from './stores/tutorial-store';
import SceneBoard from './components/scene/SceneBoard';
import AIChat from './components/ai/AIChat';

function App() {
  const { project, createNewProject } = useProjectStore();
  const { isCompleted, startTutorial } = useTutorialStore();

  useEffect(() => {
    // Create default project if none exists
    if (!project) {
      createNewProject('My Game Score');
    }

    // Start tutorial if not completed
    if (!isCompleted) {
      // Auto-start tutorial on first visit
      // For now, skip auto-start
      // startTutorial();
    }
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {project.scenes.length} scene{project.scenes.length !== 1 ? 's' : ''} • {project.bpm} BPM
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition"
                onClick={() => {
                  // TODO: Export functionality
                  console.log('Export clicked');
                }}
              >
                Export Project
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <SceneBoard />
        </div>
      </main>

      {/* AI Chat Sidebar */}
      <AIChat />
    </div>
  );
}

export default App;
