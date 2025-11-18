import { useState } from 'react';
import { Gamepad2, Wand2, Upload } from 'lucide-react';
import { GenerationForm } from './components/GenerationForm';
import { ImageUpload } from './components/ImageUpload';
import { AssetLibrary } from './components/AssetLibrary';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

type Tab = 'text-to-sprite' | 'image-to-sprite';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('text-to-sprite');

  const handleAssetGenerated = () => {
    // Trigger library refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ThemeProvider>
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

        {/* Generation Forms */}
        <section>
          {activeTab === 'text-to-sprite' ? (
            <GenerationForm onGenerated={handleAssetGenerated} />
          ) : (
            <ImageUpload onConverted={handleAssetGenerated} />
          )}
        </section>

        {/* Asset Library */}
        <section>
          <AssetLibrary refreshTrigger={refreshTrigger} />
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
    </ThemeProvider>
  );
}

export default App;
