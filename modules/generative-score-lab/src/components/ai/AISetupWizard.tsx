import { useState } from 'react';
import { useAIStore } from '@/stores/ai-store';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import type { AIClientId, AIConfig, OpenRouterConfig, MinimaxConfig, GLMConfig, LocalConfig } from '@/types';
import { setupOllama } from '@/lib/ai/ollama-setup';

interface AISetupWizardProps {
  open: boolean;
  onClose: () => void;
}

export default function AISetupWizard({ open, onClose }: AISetupWizardProps) {
  const { config, setConfig } = useAIStore();
  const [provider, setProvider] = useState<AIClientId>(config?.provider || 'openrouter');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(config?.model || '');
  const [baseURL, setBaseURL] = useState(
    (config && config.provider === 'local' ? config.baseURL : undefined) || 'http://localhost:11434'
  );
  const [groupId, setGroupId] = useState(
    (config && config.provider === 'minimax' ? (config as MinimaxConfig).groupId : undefined) || ''
  );
  const [validationError, setValidationError] = useState('');

  const handleSave = () => {
    setValidationError('');
    let newConfig: AIConfig;

    switch (provider) {
      case 'openrouter':
        if (!apiKey || !model) {
          setValidationError('Please provide both API key and model for OpenRouter');
          return;
        }
        newConfig = { provider, apiKey, model } as OpenRouterConfig;
        break;

      case 'minimax':
        if (!apiKey || !groupId || !model) {
          setValidationError('Please provide API key, Group ID, and model for Minimax');
          return;
        }
        newConfig = { provider, apiKey, groupId, model } as MinimaxConfig;
        break;

      case 'glm':
        if (!apiKey || !model) {
          setValidationError('Please provide both API key and model for GLM');
          return;
        }
        newConfig = { provider, apiKey, model } as GLMConfig;
        break;

      case 'local':
        if (!baseURL || !model) {
          setValidationError('Please provide both base URL and model name for local AI');
          return;
        }
        newConfig = { provider, baseURL, model } as LocalConfig;
        break;

      default:
        return;
    }

    setConfig(newConfig);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      title="Configure AI Assistant"
      description="Set up your AI provider and API credentials to enable AI-powered music generation"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Provider
          </label>
          <Select
            value={provider}
            onValueChange={(value: string) => setProvider(value as AIClientId)}
            options={[
              { value: 'openrouter', label: 'OpenRouter (Cloud)' },
              { value: 'minimax', label: 'Minimax M2 (Cloud)' },
              { value: 'glm', label: 'GLM 4.6 (Cloud)' },
              { value: 'local', label: 'Ollama (Local)' },
            ]}
          />
          <p className="text-xs text-gray-500 mt-1">
            {provider === 'local'
              ? 'Run AI models locally using Ollama'
              : 'Cloud AI providers require an API key'}
          </p>
        </div>

        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {validationError}
          </div>
        )}

        {provider === 'openrouter' && (
          <>
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
            />
            <Input
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="anthropic/claude-3.5-sonnet"
            />
            <p className="text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest-600 hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </>
        )}

        {provider === 'minimax' && (
          <>
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Minimax API key"
            />
            <Input
              label="Group ID"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="Your Group ID"
            />
            <Input
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="abab6.5-chat"
            />
            <p className="text-xs text-gray-500">
              Available models: abab6.5-chat, abab5.5-chat
            </p>
          </>
        )}

        {provider === 'glm' && (
          <>
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your GLM API key"
            />
            <Input
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="glm-4-plus"
            />
            <p className="text-xs text-gray-500">
              Available models: glm-4-plus, glm-4-0520, glm-4
            </p>
          </>
        )}

        {provider === 'local' && (
          <>
            <Input
              label="Ollama URL"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <Input
              label="Model Name"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="llama3.1"
            />
            <TestOllamaConnection baseURL={baseURL} model={model} />
            <p className="text-xs text-gray-500">
              Make sure Ollama is running and the model is downloaded. Install Ollama from{' '}
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest-600 hover:underline"
              >
                ollama.ai
              </a>
            </p>
          </>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Test Ollama connection component
 */
function TestOllamaConnection({ baseURL, model }: { baseURL: string; model: string }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!baseURL || !model) {
      setResult({
        success: false,
        message: 'Please enter both Ollama URL and Model Name',
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const testResult = await setupOllama({
        provider: 'local',
        baseURL,
        model,
      });
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleTest}
        disabled={testing || !baseURL || !model}
        className="w-full"
      >
        {testing ? 'Testing...' : 'Test Connection'}
      </Button>
      {result && (
        <div
          className={`text-xs p-2 rounded ${
            result.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="font-semibold mb-1">
            {result.success ? '✓ Connection Successful' : '✗ Connection Failed'}
          </div>
          <div className="whitespace-pre-line">{result.message}</div>
        </div>
      )}
    </div>
  );
}
