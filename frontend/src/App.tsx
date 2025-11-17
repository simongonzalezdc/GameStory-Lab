import { useState } from 'react';
import { Gamepad2, Wand2, Upload } from 'lucide-react';
import { GenerationForm } from './components/GenerationForm';
import { ImageUpload } from './components/ImageUpload';
import { AssetLibrary } from './components/AssetLibrary';

type Tab = 'text-to-sprite' | 'image-to-sprite';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('text-to-sprite');

  const handleAssetGenerated = () => {
    // Trigger library refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="text-purple-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Game Asset Generator</h1>
              <p className="text-sm text-gray-600">
                Create game-ready assets with AI • Cloud Models + Local Generation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab('text-to-sprite')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition
              ${activeTab === 'text-to-sprite'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
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
                : 'text-gray-600 hover:bg-gray-100'
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
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Supports: OpenRouter (Gemini 2.5) • Google (Imagen 3) • OpenAI (DALL-E 3)
            </p>
            <p className="mt-2 text-xs">
              Built with React, FastAPI, and AI • v1.0.0 MVP
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
