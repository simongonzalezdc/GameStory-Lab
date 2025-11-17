import { useEffect, useState, lazy, Suspense } from 'react';
import { useProjectStore } from './stores/project-store';
import { useTutorialStore } from './stores/tutorial-store';
import { useUIStore } from './stores/ui-store';
import SceneBoard from './components/scene/SceneBoard';
import SceneEditor from './components/scene/SceneEditor';
import KeyboardShortcutsHelp from './components/ui/KeyboardShortcutsHelp';
import ErrorNotification from './components/ui/ErrorNotification';
import { useKeyboardShortcuts, isTypingInInput } from './hooks/useKeyboardShortcuts';

// Lazy load heavy components
const AIChat = lazy(() => import('./components/ai/AIChat'));
const ExportDialog = lazy(() => import('./components/project/ExportDialog'));
const TutorialOverlay = lazy(() => import('./components/tutorial/TutorialOverlay'));

function App() {
  const { project, createNewProject, currentSceneId } = useProjectStore();
  const { isCompleted, startTutorial } = useTutorialStore();
  const { toggleAIChat } = useUIStore();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  useEffect(() => {
    // Create default project if none exists
    if (!project) {
      createNewProject('My Game Score');
    }

    // Start tutorial automatically on first visit
    if (!isCompleted) {
      const timer = setTimeout(() => {
        startTutorial();
      }, 500); // Small delay to ensure UI is ready
      return () => clearTimeout(timer);
    }
  }, [project, isCompleted, startTutorial, createNewProject]);

  // Register global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      action: () => {
        if (!isTypingInInput()) {
          setShowExportDialog(true);
        }
      },
      description: 'Export Project (Save)',
    },
    {
      key: '/',
      ctrl: true,
      action: () => {
        toggleAIChat();
      },
      description: 'Toggle AI Chat',
    },
    {
      key: 'k',
      ctrl: true,
      action: () => {
        toggleAIChat();
      },
      description: 'Toggle AI Chat (alternate)',
    },
    {
      key: '?',
      action: () => {
        if (!isTypingInInput()) {
          setShowShortcutsHelp(true);
        }
      },
      description: 'Show keyboard shortcuts',
      preventDefault: false,
    },
  ]);

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
    <>
      {project && (
        <>
          <Suspense fallback={<div />}>
            <ExportDialog
              open={showExportDialog}
              onClose={() => setShowExportDialog(false)}
              project={project}
            />
          </Suspense>
          <KeyboardShortcutsHelp
            open={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
          />
        </>
      )}
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
              {!isCompleted && (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  onClick={() => startTutorial()}
                >
                  Start Tutorial
                </button>
              )}
              <button
                className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition"
                onClick={() => setShowExportDialog(true)}
                data-tutorial="export"
              >
                Export Project
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {currentSceneId ? <SceneEditor /> : <SceneBoard />}
        </div>
      </main>

        {/* AI Chat Sidebar */}
        <Suspense fallback={<div />}>
          <AIChat />
        </Suspense>
      </div>

      {/* Error Notifications */}
      <ErrorNotification />

      {/* Tutorial Overlay */}
      <Suspense fallback={<div />}>
        <TutorialOverlay />
      </Suspense>
    </>
  );
}

export default App;
