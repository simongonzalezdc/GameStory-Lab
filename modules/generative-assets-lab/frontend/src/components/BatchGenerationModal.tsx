import { useState } from 'react';
import { X, Zap, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';
import type { Asset } from '../types/asset';

interface BatchGenerationModalProps {
  basePrompt: string;
  onClose: () => void;
  onComplete: (assets: Asset[]) => void;
}

export function BatchGenerationModal({ basePrompt, onClose, onComplete }: BatchGenerationModalProps) {
  const [prompt, setPrompt] = useState(basePrompt);
  const [model, setModel] = useState<string>('openrouter');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress(`Generating ${count} variations...`);

    try {
      const response = await apiClient.batchGenerate({
        prompt: prompt.trim(),
        model,
        count,
        dimensions: { width: 64, height: 64 },
        style_tags: [],
        project_name: null,
      });

      if (response.success && response.assets.length > 0) {
        setProgress(`✓ Generated ${response.assets.length} assets successfully!`);
        setTimeout(() => {
          onComplete(response.assets as Asset[]);
          onClose();
        }, 1000);
      } else {
        setError('Batch generation failed. Please try again.');
        setGenerating(false);
      }
    } catch (err: any) {
      console.error('Batch generation error:', err);
      setError(err.message || 'Failed to generate batch assets');
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-purple-600 dark:text-purple-400" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Batch Generation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Generate multiple variations from one prompt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="e.g., pixel art fantasy sword"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Each variation will have slight differences while maintaining the core concept
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* AI Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="openrouter">OpenRouter (Gemini 2.5 Flash)</option>
                <option value="google">Google (Imagen 3)</option>
                <option value="chatgpt">ChatGPT (DALL-E 3)</option>
              </select>
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Variations
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} variations
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2">How it works:</h3>
            <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
              <li>• Each variation adds subtle changes to the prompt</li>
              <li>• Generates {count} unique assets from your base prompt</li>
              <li>• Perfect for creating asset packs or exploring options</li>
              <li>• Each asset is saved to your library automatically</li>
            </ul>
          </div>

          {/* Progress/Error */}
          {progress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-300 text-center">{progress}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300 text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Estimated time: ~{count * 6} seconds
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={generating}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Generate {count} Variations
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
