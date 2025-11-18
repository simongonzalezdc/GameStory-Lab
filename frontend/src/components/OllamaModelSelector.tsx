import { useState, useEffect } from 'react';
import { Server, Check, X, RefreshCw, ChevronDown } from 'lucide-react';

interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

interface OllamaStatus {
  available: boolean;
  url: string;
  models: OllamaModel[];
  error?: string;
}

export function OllamaModelSelector() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('ollama-selected-model') || 'llama3.2';
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchOllamaStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health/ollama');
      const data = await response.json();
      setStatus(data);

      // If selected model is not available, select first available model
      if (data.available && data.models.length > 0) {
        const modelNames = data.models.map((m: OllamaModel) => m.name);
        if (!modelNames.includes(selectedModel)) {
          setSelectedModel(data.models[0].name);
          localStorage.setItem('ollama-selected-model', data.models[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Ollama status:', error);
      setStatus({
        available: false,
        url: 'http://localhost:11434',
        models: [],
        error: 'Failed to connect to Ollama service',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOllamaStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchOllamaStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    localStorage.setItem('ollama-selected-model', modelName);
    setShowDropdown(false);
    // Also save to window for other components to access
    (window as any).selectedOllamaModel = modelName;
  };

  // Expose selected model globally for other components
  useEffect(() => {
    (window as any).selectedOllamaModel = selectedModel;
  }, [selectedModel]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <RefreshCw className="animate-spin" size={16} />
          <span className="text-sm">Checking Ollama status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Local Ollama</h3>
        </div>
        <div className="flex items-center gap-2">
          {status?.available ? (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check size={14} />
              Running
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
              <X size={14} />
              Offline
            </span>
          )}
          <button
            onClick={fetchOllamaStatus}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Status Message */}
      {!status?.available && (
        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-300">
          <p className="font-medium">Ollama not running</p>
          <p className="text-xs mt-1">
            Start Ollama to use local AI models for prompt enhancement and chat features.
          </p>
          <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-400">
            URL: {status?.url}
          </p>
        </div>
      )}

      {status?.error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300">
          <p className="font-medium">Error</p>
          <p className="text-xs mt-1">{status.error}</p>
        </div>
      )}

      {/* Model Selector */}
      {status?.available && status.models.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Model
          </label>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {selectedModel}
              </span>
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {status.models.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => handleModelSelect(model.name)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition border-b border-gray-200 dark:border-gray-600 last:border-b-0 ${
                      selectedModel === model.name
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-gray-900 dark:text-white">
                          {model.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Size: {model.size}
                        </div>
                      </div>
                      {selectedModel === model.name && (
                        <Check size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {status.models.length} model{status.models.length !== 1 ? 's' : ''} available • Used for prompt enhancement
          </p>
        </div>
      )}

      {status?.available && status.models.length === 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium">No models installed</p>
          <p className="text-xs mt-1">
            Install a model with: <code className="bg-white dark:bg-gray-800 px-1 rounded">ollama pull llama3.2</code>
          </p>
        </div>
      )}
    </div>
  );
}
