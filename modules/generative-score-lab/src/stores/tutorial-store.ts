import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialState {
  isActive: boolean;
  currentStep: number;
  completedSteps: number[];
  isCompleted: boolean;

  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  setStep: (step: number) => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      isCompleted: false,

      startTutorial: () =>
        set({
          isActive: true,
          currentStep: 0,
        }),

      nextStep: () => {
        const { currentStep, completedSteps } = get();
        set({
          currentStep: currentStep + 1,
          completedSteps: [...new Set([...completedSteps, currentStep])],
        });
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      skipTutorial: () =>
        set({
          isActive: false,
          isCompleted: true,
        }),

      completeTutorial: () =>
        set({
          isActive: false,
          isCompleted: true,
        }),

      resetTutorial: () =>
        set({
          isActive: false,
          currentStep: 0,
          completedSteps: [],
          isCompleted: false,
        }),

      setStep: (step) => set({ currentStep: step }),
    }),
    {
      name: 'generative-score-lab-tutorial',
    }
  )
);
