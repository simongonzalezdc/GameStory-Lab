import { useState } from 'react';
import { useAIStore } from '@/stores/ai-store';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import type { AIClientId } from '@/types';

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
    (config as any)?.baseURL || 'http://localhost:11434'
  );
  const [groupId, setGroupId] = useState((config as any)?.groupId || '');

  const handleSave = () => {
    let newConfig: any = { provider };

    switch (provider) {
      case 'openrouter':
        if (!apiKey || !model) {
          alert('Please provide both API key and model for OpenRouter');
          return;
        }
        newConfig = { provider, apiKey, model };
        break;

      case 'minimax':
        if (!apiKey || !groupId || !model) {
          alert('Please provide API key, Group ID, and model for Minimax');
          return;
        }
        newConfig = { provider, apiKey, groupId, model };
        break;

      case 'glm':
        if (!apiKey || !model) {
          alert('Please provide both API key and model for GLM');
          return;
        }
        newConfig = { provider, apiKey, model };
        break;

      case 'local':
        if (!baseURL || !model) {
          alert('Please provide both base URL and model name for local AI');
          return;
        }
        newConfig = { provider, baseURL, model };
        break;
    }

    setConfig(newConfig);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Configure AI Assistant">
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
