import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types';

interface UIStoreState extends UIState {
  // Actions
  setActivePanel: (panel: UIState['activePanel']) => void;
  setSelectedScene: (sceneId: string | null) => void;
  setSelectedTrack: (trackId: string | null) => void;
  setSelectedClip: (clipId: string | null) => void;
  toggleAIChat: () => void;
  openAIChat: () => void;
  closeAIChat: () => void;
  setTutorialActive: (active: boolean) => void;
  setTutorialStep: (step: number) => void;
  nextTutorialStep: () => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set, get) => ({
      activePanel: 'scenes',
      selectedSceneId: null,
      selectedTrackId: null,
      selectedClipId: null,
      isAIChatOpen: false,
      isTutorialActive: false,
      tutorialStep: 0,
      modals: {
        sceneCreate: false,
        trackAdd: false,
        export: false,
        aiSetup: false,
      },

      setActivePanel: (panel) => set({ activePanel: panel }),
      setSelectedScene: (sceneId) => set({ selectedSceneId: sceneId }),
      setSelectedTrack: (trackId) => set({ selectedTrackId: trackId }),
      setSelectedClip: (clipId) => set({ selectedClipId: clipId }),
      toggleAIChat: () => set((state) => ({ isAIChatOpen: !state.isAIChatOpen })),
      openAIChat: () => set({ isAIChatOpen: true }),
      closeAIChat: () => set({ isAIChatOpen: false }),
      setTutorialActive: (active) => set({ isTutorialActive: active }),
      setTutorialStep: (step) => set({ tutorialStep: step }),
      nextTutorialStep: () => set((state) => ({ tutorialStep: state.tutorialStep + 1 })),
      openModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: true },
        })),
      closeModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: false },
        })),
      closeAllModals: () =>
        set({
          modals: {
            sceneCreate: false,
            trackAdd: false,
            export: false,
            aiSetup: false,
          },
        }),
    }),
    {
      name: 'generative-score-lab-ui',
      partialize: (state) => ({
        activePanel: state.activePanel,
        isTutorialActive: state.isTutorialActive,
        tutorialStep: state.tutorialStep,
      }),
    }
  )
);
