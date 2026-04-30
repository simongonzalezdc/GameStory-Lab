export interface LLMModel {
  id: string;
  name: string;
  provider: 'ollama' | 'openrouter';
  contextLength: number;
  cost?: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
}

export const OLLAMA_MODELS: LLMModel[] = [
  {
    id: 'smollm2:1.7b',
    name: 'SmolLM2 1.7B',
    provider: 'ollama',
    contextLength: 8192,
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 3B',
    provider: 'ollama',
    contextLength: 128000,
  },
  {
    id: 'qwen2.5-coder:7b',
    name: 'Qwen2.5 Coder 7B',
    provider: 'ollama',
    contextLength: 32768,
  },
  {
    id: 'deepseek-coder-v2:16b',
    name: 'DeepSeek Coder V2 16B',
    provider: 'ollama',
    contextLength: 16384,
  },
];

export const OPENROUTER_MODELS: LLMModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openrouter',
    contextLength: 128000,
    cost: {
      input: 0.15,
      output: 0.6,
    },
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    contextLength: 200000,
    cost: {
      input: 3.0,
      output: 15.0,
    },
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'openrouter',
    contextLength: 1000000,
    cost: {
      input: 0,
      output: 0,
    },
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'openrouter',
    contextLength: 64000,
    cost: {
      input: 0.14,
      output: 0.28,
    },
  },
];

export const ALL_MODELS = [...OLLAMA_MODELS, ...OPENROUTER_MODELS];

export function getModel(id: string): LLMModel | undefined {
  return ALL_MODELS.find((model) => model.id === id);
}

export function getDefaultModel(): LLMModel {
  return OLLAMA_MODELS[0]; // Default to SmolLM2 1.7B (free, local)
}
