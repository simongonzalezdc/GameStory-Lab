import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { GenerationForm } from './components/GenerationForm';
import { AssetLibrary } from './components/AssetLibrary';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                Create game-ready assets with AI • Cloud + Local Models (Ollama)
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Generation Form */}
        <section>
          <GenerationForm onGenerated={handleAssetGenerated} />
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
              Supports: OpenRouter (FLUX) • Google Gemini • ChatGPT (DALL-E 3) • Ollama (Local Models)
            </p>
            <p className="mt-2 text-xs">
              Built with React, FastAPI, and LangChain • v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
