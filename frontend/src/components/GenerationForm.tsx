import { useState } from 'react';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { apiClient } from '../services/api';
import type { GenerationRequest } from '../types/generation';
import type { Asset } from '../types/asset';
import { BatchGenerationModal } from './BatchGenerationModal';
import { ErrorMessage } from './ErrorMessage';

interface GenerationFormProps {
  onGenerated?: () => void;
}

export function GenerationForm({ onGenerated }: GenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'openrouter' | 'google' | 'chatgpt'>('openrouter');
  const [dimensions, setDimensions] = useState({ width: 64, height: 64 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Note: Ollama status check infrastructure kept for future text-based features
  // (prompt enhancement, chat assistance, etc.)
  // const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);

  const handleBatchComplete = (assets: Asset[]) => {
    setSuccess(`✓ Generated ${assets.length} assets successfully!`);
    onGenerated?.();
    // Clear after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
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

  const handleRetry = () => {
    setError(null);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto transition-colors">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        <Sparkles className="text-purple-500 dark:text-purple-400" />
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
            <option value="openrouter">OpenRouter (Gemini 2.5 Flash) - Free</option>
            <option value="google">Google (Imagen 3) - Cloud</option>
            <option value="chatgpt">OpenAI (DALL-E 3) - Cloud</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: OpenRouter model is free with 20 requests/minute limit. Local models (Ollama) coming soon for text features.
          </p>
        </div>

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
        {error && <ErrorMessage error={error} onRetry={handleRetry} />}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3">
            {success}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
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
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
            title="Generate multiple variations"
          >
            <Zap size={20} />
            Batch
          </button>
        </div>
      </form>

      {/* Batch Generation Modal */}
      {showBatchModal && (
        <BatchGenerationModal
          basePrompt={prompt}
          onClose={() => setShowBatchModal(false)}
          onComplete={handleBatchComplete}
        />
      )}
    </div>
  );
}
