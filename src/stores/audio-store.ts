import { create } from 'zustand';

interface AudioState {
  isPlaying: boolean;
  currentTime: number; // In bars
  bpm: number;
  isInitialized: boolean;
  currentSceneId: string | null;

  // Actions
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setBPM: (bpm: number) => void;
  setInitialized: (initialized: boolean) => void;
  setCurrentScene: (sceneId: string | null) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  bpm: 120,
  isInitialized: false,
  currentSceneId: null,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setBPM: (bpm) => set({ bpm }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),
  reset: () =>
    set({
      isPlaying: false,
      currentTime: 0,
      currentSceneId: null,
    }),
}));
