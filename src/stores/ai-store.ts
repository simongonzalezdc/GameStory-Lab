import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, AIConfig, AIClientId } from '@/types';

interface AIStoreState {
  messages: ChatMessage[];
  isLoading: boolean;
  config: AIConfig | null;
  selectedProvider: AIClientId | null;
  abortController: AbortController | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setConfig: (config: AIConfig) => void;
  setProvider: (provider: AIClientId) => void;
  clearConfig: () => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelRequest: () => void;
}

export const useAIStore = create<AIStoreState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      config: null,
      selectedProvider: null,
      abortController: null,

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

      setAbortController: (controller) => set({ abortController: controller }),

      cancelRequest: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
          set({ abortController: null, isLoading: false });
        }
      },
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
