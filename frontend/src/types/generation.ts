import { Asset } from './asset';

export interface GenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model: 'openrouter' | 'google' | 'chatgpt' | 'ollama';
  ollama_model?: string;
  reference_image?: string;
  style_tags?: string[];
  project_name?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface GenerationResponse {
  success: boolean;
  asset?: Asset;
  generation_id?: string;
  generation_time_ms?: number;
  error?: string;
}

export interface RefineRequest {
  asset_id: string;
  instruction: string;
  model: 'openrouter' | 'google' | 'chatgpt' | 'ollama';
  ollama_model?: string;
}

export interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

export interface OllamaStatus {
  available: boolean;
  url: string;
  models: OllamaModel[];
  error?: string;
}
