import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Cpu } from 'lucide-react';
import { apiClient } from '../services/api';
import type { GenerationRequest, OllamaStatus } from '../types/generation';

interface GenerationFormProps {
  onGenerated?: () => void;
}

export function GenerationForm({ onGenerated }: GenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'openrouter' | 'google' | 'chatgpt' | 'ollama'>('openrouter');
  const [ollamaModel, setOllamaModel] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [dimensions, setDimensions] = useState({ width: 64, height: 64 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const status = await apiClient.checkOllamaStatus();
      setOllamaStatus(status);
      if (status.available && status.models.length > 0) {
        setOllamaModel(status.models[0].name);
      }
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const request: GenerationRequest = {
        prompt,
        model,
        dimensions,
      };

      if (model === 'ollama') {
        if (!ollamaModel) {
          throw new Error('Please select an Ollama model');
        }
        request.ollama_model = ollamaModel;
      }

      const response = await apiClient.generateAsset(request);

      if (response.success) {
        setSuccess(`Asset generated successfully in ${response.generation_time_ms}ms!`);
        setPrompt('');
        onGenerated?.();
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="text-purple-500" />
        Generate Game Asset
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your asset
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., pixel art fantasy sword with blue gems, 32x32, transparent background"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            required
            minLength={10}
            maxLength={2000}
          />
          <p className="text-sm text-gray-500 mt-1">{prompt.length}/2000 characters</p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="openrouter">OpenRouter (FLUX) - Cloud</option>
            <option value="google">Google Gemini - Cloud</option>
            <option value="chatgpt">ChatGPT (DALL-E 3) - Cloud</option>
            <option value="ollama" disabled={!ollamaStatus?.available}>
              Ollama (Local) {ollamaStatus?.available ? '✓' : '✗'}
            </option>
          </select>
        </div>

        {/* Ollama Model Selection */}
        {model === 'ollama' && ollamaStatus?.available && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Cpu size={16} />
              Local Model
            </label>
            <select
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {ollamaStatus.models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.size})
                </option>
              ))}
            </select>
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <Cpu size={14} />
              Running locally - Private & Free
            </p>
          </div>
        )}

        {/* Ollama Not Available */}
        {model === 'ollama' && !ollamaStatus?.available && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Ollama not available:</strong> {ollamaStatus?.error || 'Not running'}
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              Install Ollama from{' '}
              <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">
                ollama.ai
              </a>{' '}
              and run "ollama serve"
            </p>
          </div>
        )}

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: parseInt(e.target.value) })}
              min={16}
              max={2048}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) })}
              min={16}
              max={2048}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Asset
            </>
          )}
        </button>
      </form>
    </div>
  );
}
