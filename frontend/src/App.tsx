import { useState } from 'react';
import { Gamepad2, Wand2, Upload } from 'lucide-react';
import { GenerationForm } from './components/GenerationForm';
import { ImageUpload } from './components/ImageUpload';
import { AssetLibrary } from './components/AssetLibrary';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { OllamaModelSelector } from './components/OllamaModelSelector';
import { AssetStatistics } from './components/AssetStatistics';
import { RecentProjects } from './components/RecentProjects';

type Tab = 'text-to-sprite' | 'image-to-sprite';

function AppContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('text-to-sprite');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { toggleTheme } = useTheme();

  const handleAssetGenerated = () => {
    // Trigger library refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGenerate = () => {
    // Trigger the submit button for the active form
    const submitBtn = document.getElementById('generate-submit-btn') as HTMLButtonElement;
    submitBtn?.click();
  };

  const handleFocusPrompt = () => {
    // Focus the prompt input
    const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
    promptInput?.focus();
  };

  const handleExport = () => {
    // Open the first asset's export modal if available
    const firstExportBtn = document.querySelector('[data-export-btn]') as HTMLButtonElement;
    firstExportBtn?.click();
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gamepad2 className="text-purple-600 dark:text-purple-400" size={32} />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Game Asset Generator</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Create game-ready assets with AI • Cloud Models + Local Generation
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Tabs */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm max-w-2xl mx-auto transition-colors">
            <button
              onClick={() => setActiveTab('text-to-sprite')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition
                ${activeTab === 'text-to-sprite'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Wand2 size={20} />
              Text-to-Sprite
            </button>
            <button
              onClick={() => setActiveTab('image-to-sprite')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition
                ${activeTab === 'image-to-sprite'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Upload size={20} />
              Image-to-Sprite
            </button>
          </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Forms - Left Column (2/3 width on large screens) */}
          <section className="lg:col-span-2">
            {activeTab === 'text-to-sprite' ? (
              <GenerationForm onGenerated={handleAssetGenerated} />
            ) : (
              <ImageUpload onConverted={handleAssetGenerated} />
            )}
          </section>

          {/* Settings Sidebar - Right Column (1/3 width on large screens) */}
          <aside className="space-y-4">
            <AssetStatistics />
            <RecentProjects
              onSelectProject={setSelectedProject}
              currentProject={selectedProject}
            />
            <OllamaModelSelector />
          </aside>
        </div>

        {/* Asset Library - Full Width */}
        <section className="mt-8">
          <AssetLibrary
            refreshTrigger={refreshTrigger}
            selectedProject={selectedProject}
          />
        </section>
      </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600 dark:text-gray-300">
              <p>
                Supports: OpenRouter (Gemini 2.5) • Google (Imagen 3) • OpenAI (DALL-E 3)
              </p>
              <p className="mt-2 text-xs">
                Built with React, FastAPI, and AI • v2.0.0-phase2
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onGenerate={handleGenerate}
        onExport={handleExport}
        onToggleDarkMode={toggleTheme}
        onFocusPrompt={handleFocusPrompt}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
