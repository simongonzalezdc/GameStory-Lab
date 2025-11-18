import { useState } from 'react';
import { Send, Loader2, Wand2 } from 'lucide-react';
import { apiClient } from '../services/api';
import type { Asset } from '../types/asset';

interface ChatInterfaceProps {
  asset: Asset;
  onRefinementComplete: (newAsset: Asset) => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { id: 'darker', label: 'Darker', instruction: 'make the colors darker and increase contrast' },
  { id: 'lighter', label: 'Lighter', instruction: 'make the colors lighter and brighter' },
  { id: 'more_detail', label: 'More Detail', instruction: 'add more intricate details and texture' },
  { id: 'less_detail', label: 'Simpler', instruction: 'simplify and reduce details for a cleaner look' },
];

export function ChatInterface({ asset, onRefinementComplete, onClose }: ChatInterfaceProps) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'openrouter' | 'google' | 'chatgpt'>('openrouter');

  const handleRefine = async (refinementInstruction: string) => {
    if (!refinementInstruction.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.refineAsset({
        asset_id: asset.id,
        instruction: refinementInstruction.trim(),
        model: selectedModel,
      });

      if (response.success && response.asset) {
        onRefinementComplete(response.asset as Asset);
        setInstruction('');
      } else {
        setError('Refinement failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Refinement error:', err);
      setError(err.response?.data?.detail || 'Failed to refine asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRefine(instruction);
  };

  const handleQuickAction = (quickInstruction: string) => {
    handleRefine(quickInstruction);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Refine Asset
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Asset Preview */}
      <div className="mb-4 flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <img
          src={asset.file_url}
          alt={asset.file_name}
          className="w-20 h-20 object-contain bg-white border border-gray-200 rounded"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{asset.file_name}</p>
          <p className="text-xs text-gray-500 truncate">
            {asset.generation_prompt || 'No prompt'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Version {asset.version_number}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.instruction)}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Provider:
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as any)}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="openrouter">OpenRouter (Gemini 2.5 Flash - Free)</option>
          <option value="google">Google Imagen 3</option>
          <option value="chatgpt">OpenAI DALL-E 3</option>
        </select>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Refinement Instruction:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., make it glow with blue energy"
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !instruction.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Refine
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            Ollama is enhancing your instruction, then generating refined image...
          </span>
        </div>
      )}

      {/* Help Text */}
      {!loading && !error && (
        <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium mb-1">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Be specific: "add glowing purple energy around the sword"</li>
            <li>Use descriptive words: darker, brighter, more detailed, simplified</li>
            <li>Ollama will enhance your instruction before generating</li>
            <li>Each refinement creates a new version you can rollback to</li>
          </ul>
        </div>
      )}
    </div>
  );
}
