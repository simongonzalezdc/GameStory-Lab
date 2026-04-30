/**
 * UI state and component types
 */

export interface UIState {
  activePanel: 'scenes' | 'editor' | 'ai' | 'export';
  selectedSceneId: string | null;
  selectedTrackId: string | null;
  selectedClipId: string | null;
  isAIChatOpen: boolean;
  isTutorialActive: boolean;
  tutorialStep: number;
  modals: {
    sceneCreate: boolean;
    trackAdd: boolean;
    export: boolean;
    aiSetup: boolean;
  };
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  action?: () => void;
}

export interface VoiceCaptureState {
  isRecording: boolean;
  detectedPitch: number | null;
  targetKey: string;
  targetScale: string;
  confidence: number;
}
