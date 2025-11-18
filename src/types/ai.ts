/**
 * AI assistant types
 */

import type { Project, Scene } from './project';

export interface AIClient {
  id: AIClientId;
  name: string;
  sendMessage(input: AIRequest): Promise<AIResponse>;
  isConfigured(): Promise<boolean>;
}

export type AIClientId = 'openrouter' | 'minimax' | 'glm' | 'local';

export interface AIRequest {
  messages: ChatMessage[];
  projectContext?: ProjectContext;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  actions?: MusicAction[];
  error?: string;
}

export interface MusicAction {
  type: 'updateScene' | 'updateTrack' | 'updateClip' | 'addTrack' | 'changeKey';
  target: string; // Path to target
  params: Record<string, any>;
}

export interface ProjectContext {
  currentScene?: Scene;
  projectSnapshot?: Partial<Project>;
  recentActions?: RecentAction[];
}

export interface RecentAction {
  action: MusicAction;
  success: boolean;
  error?: string;
}

export interface AIConfig {
  provider: AIClientId;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface OpenRouterConfig extends AIConfig {
  provider: 'openrouter';
  apiKey: string;
  model: string; // e.g., "anthropic/claude-3.5-sonnet"
}

export interface MinimaxConfig extends AIConfig {
  provider: 'minimax';
  apiKey: string;
  groupId: string;
  model: 'abab6.5-chat' | 'abab5.5-chat';
}

export interface GLMConfig extends AIConfig {
  provider: 'glm';
  apiKey: string;
  model: 'glm-4-plus' | 'glm-4-0520' | 'glm-4';
}

export interface LocalConfig extends AIConfig {
  provider: 'local';
  baseURL: string; // e.g., "http://localhost:11434"
  model: string; // e.g., "llama3.1"
}
