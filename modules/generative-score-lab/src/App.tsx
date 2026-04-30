import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useProjectStore } from './stores/project-store';
import { useTutorialStore } from './stores/tutorial-store';
import { useUIStore } from './stores/ui-store';
import SceneBoard from './components/scene/SceneBoard';
import SceneEditor from './components/scene/SceneEditor';
import KeyboardShortcutsHelp from './components/ui/KeyboardShortcutsHelp';
import ErrorNotification from './components/ui/ErrorNotification';
import SettingsDialog from './components/ui/SettingsDialog';
import { useKeyboardShortcuts, isTypingInInput } from './hooks/useKeyboardShortcuts';
import { getAudioEngine } from './lib/audio/engine';
import { useAutoSave } from './hooks/useAutoSave';
import { TutorialErrorBoundary } from './components/TutorialErrorBoundary';
import { errorHandler, ErrorSeverity } from './lib/errors/error-handler';
import { initErrorReporting } from './lib/errors/error-reporting';
import { initAnalytics } from './lib/analytics/analytics';
import { initPerformanceMonitoring } from './lib/analytics/performance';
import { useAIStore } from './stores/ai-store';
import { setupOllama } from './lib/ai/ollama-setup';
import type { LocalConfig } from './types';

// Lazy load heavy components
const AIChat = lazy(() => import('./components/ai/AIChat'));
const ExportDialog = lazy(() => import('./components/project/ExportDialog'));
const ShareDialog = lazy(() => import('./components/project/ShareDialog'));
const TutorialOverlay = lazy(() => import('./components/tutorial/TutorialOverlay'));

function App() {
  const { project, createNewProject, currentSceneId, undo, redo, canUndo, canRedo } = useProjectStore();
  const { isCompleted, startTutorial } = useTutorialStore();
  const { toggleAIChat } = useUIStore();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Enable auto-save
  useAutoSave();

  const { config } = useAIStore();

  // Initialize error reporting, analytics, and performance monitoring on mount
  useEffect(() => {
    initErrorReporting();
    initAnalytics();
    initPerformanceMonitoring();
  }, []);

  // Check Ollama setup if local provider is configured
  // Automatically download missing models
  useEffect(() => {
    if (config?.provider === 'local' && 'baseURL' in config && 'model' in config) {
      const localConfig = config as LocalConfig;
      setupOllama(localConfig, true).then((result) => {
        if (!result.success) {
          errorHandler.handle(
            new Error(result.message),
            'Ollama Setup Check',
            ErrorSeverity.WARNING
          );
        } else {
          // Log success in development mode
          if (import.meta.env.MODE === 'development') {
            console.info('[Ollama Setup]', result.message);
          }
        }
      }).catch((error) => {
        errorHandler.handle(
          error,
          'Ollama Setup Check',
          ErrorSeverity.WARNING
        );
      });
    }
  }, [config]);

  useEffect(() => {
    // Create default project if none exists
    if (!project) {
      createNewProject('My Game Score');
    }

    // Start tutorial automatically on first visit (wrapped in error boundary)
    if (!isCompleted) {
      const timer = setTimeout(() => {
        try {
          startTutorial();
        } catch (error) {
          // If tutorial fails to start, mark as completed to prevent loop
          errorHandler.handle(
            error instanceof Error ? error : new Error('Tutorial start failed'),
            'Tutorial Auto-Start',
            ErrorSeverity.WARNING
          );
        }
      }, 500); // Small delay to ensure UI is ready
      return () => clearTimeout(timer);
    }
  }, [project, isCompleted, startTutorial, createNewProject]);

  // Cleanup audio engine on unmount
  useEffect(() => {
    return () => {
      const engine = getAudioEngine();
      engine.dispose();
    };
  }, []);

  // Memoize keyboard shortcut callbacks for better performance
  const handleExport = useCallback(() => {
    if (!isTypingInInput()) {
      setShowExportDialog(true);
    }
  }, []);

  const handleShowShortcuts = useCallback(() => {
    if (!isTypingInInput()) {
      setShowShortcutsHelp(true);
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (!isTypingInInput() && canUndo()) {
      undo();
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (!isTypingInInput() && canRedo()) {
      redo();
    }
  }, [canRedo, redo]);

  // Memoize keyboard shortcuts array to prevent recreation on every render
  const shortcuts = useMemo(
    () => [
      {
        key: 's',
        ctrl: true,
        action: handleExport,
        description: 'Export Project (Save)',
      },
      {
        key: '/',
        ctrl: true,
        action: toggleAIChat,
        description: 'Toggle AI Chat',
      },
      {
        key: 'k',
        ctrl: true,
        action: toggleAIChat,
        description: 'Toggle AI Chat (alternate)',
      },
      {
        key: '?',
        action: handleShowShortcuts,
        description: 'Show keyboard shortcuts',
        preventDefault: false,
      },
      {
        key: 'z',
        ctrl: true,
        shift: false,
        action: handleUndo,
        description: 'Undo',
        preventDefault: true,
      },
      {
        key: 'z',
        ctrl: true,
        shift: true,
        action: handleRedo,
        description: 'Redo',
        preventDefault: true,
      },
    ],
    [handleExport, handleShowShortcuts, handleUndo, handleRedo, toggleAIChat]
  );

  // Register global keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

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
            <ShareDialog
              open={showShareDialog}
              onClose={() => setShowShareDialog(false)}
              project={project}
            />
          </Suspense>
          <KeyboardShortcutsHelp
            open={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
          />
          <SettingsDialog
            open={showSettings}
            onOpenChange={setShowSettings}
          />
        </>
      )}
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {project.scenes.length} scene{project.scenes.length !== 1 ? 's' : ''} • {project.bpm} BPM
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open settings"
                title="Settings"
              >
                <svg
                  className="w-5 h-5 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
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
              <button
                className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition"
                onClick={() => setShowShareDialog(true)}
                aria-label="Share Project"
              >
                Share
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
      <TutorialErrorBoundary>
        <Suspense fallback={<div />}>
          <TutorialOverlay />
        </Suspense>
      </TutorialErrorBoundary>
    </>
  );
}

export default App;
