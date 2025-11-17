import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, AIConfig, AIClientId } from '@/types';

interface AIStoreState {
  messages: ChatMessage[];
  isLoading: boolean;
  config: AIConfig | null;
  selectedProvider: AIClientId | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setConfig: (config: AIConfig) => void;
  setProvider: (provider: AIClientId) => void;
  clearConfig: () => void;
}

export const useAIStore = create<AIStoreState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      config: null,
      selectedProvider: null,

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      clearMessages: () => set({ messages: [] }),

      setLoading: (loading) => set({ isLoading: loading }),

      setConfig: (config) =>
        set({
          config,
          selectedProvider: config.provider,
        }),

      setProvider: (provider) => set({ selectedProvider: provider }),

      clearConfig: () =>
        set({
          config: null,
          selectedProvider: null,
        }),
    }),
    {
      name: 'generative-score-lab-ai',
      partialize: (state) => ({
        config: state.config,
        selectedProvider: state.selectedProvider,
        messages: state.messages.slice(-10), // Only persist last 10 messages
      }),
    }
  )
);
