/**
 * Tutorial step definitions
 */

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  targetElement?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  actionLabel?: string;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 0,
    title: 'Welcome to Generative Score Lab',
    description: 'Create adaptive game music using AI-powered generators. This tutorial will guide you through the basics of creating your first interactive score.',
    position: 'center',
    actionLabel: 'Get Started',
  },
  {
    id: 1,
    title: 'Scene Board',
    description: 'Your project is organized into scenes. Each scene represents a different musical moment or state in your game (e.g., exploration, combat, victory). Click the "+ Add Scene" button to create your first scene.',
    targetElement: '[data-tutorial="add-scene"]',
    position: 'bottom',
    actionLabel: 'Next',
  },
  {
    id: 2,
    title: 'Scene Editor',
    description: 'Once you have a scene, click on it to open the Scene Editor. Here you can add tracks, create musical patterns with generators, and arrange your composition.',
    targetElement: '[data-tutorial="scene-card"]',
    position: 'bottom',
    actionLabel: 'Next',
  },
  {
    id: 3,
    title: 'Adding Tracks',
    description: 'Tracks represent different instruments or layers in your music. Click "+ Add Track" to create tracks for bass, lead, drums, pads, or effects. Each track can have multiple clips.',
    targetElement: '[data-tutorial="add-track"]',
    position: 'bottom',
    actionLabel: 'Next',
  },
  {
    id: 4,
    title: 'Music Generators',
    description: 'Add clips to your tracks using music generators. Choose from Euclidean rhythms, arpeggios, Markov chains, or random walk patterns. Each generator creates unique musical patterns based on your scene\'s key and scale.',
    targetElement: '[data-tutorial="add-clip"]',
    position: 'left',
    actionLabel: 'Next',
  },
  {
    id: 5,
    title: 'Playback Controls',
    description: 'Use the playback controls to preview your composition. Press Play to hear your scene, or use the spacebar as a shortcut. Stop playback with the Stop button or press Escape.',
    targetElement: '[data-tutorial="playback"]',
    position: 'bottom',
    actionLabel: 'Next',
  },
  {
    id: 6,
    title: 'AI Assistant',
    description: 'Use the AI chat (Ctrl/Cmd + K) to get help with music theory, generate ideas, or modify your composition. The AI can suggest chord progressions, help with arrangement, and explain musical concepts.',
    targetElement: '[data-tutorial="ai-chat"]',
    position: 'left',
    actionLabel: 'Next',
  },
  {
    id: 7,
    title: 'Export Your Work',
    description: 'Export your scenes as MIDI files for use in your DAW or game engine. Use Ctrl/Cmd + E to export individual scenes, or export tracks separately for more flexibility.',
    targetElement: '[data-tutorial="export"]',
    position: 'bottom',
    actionLabel: 'Next',
  },
  {
    id: 8,
    title: 'Keyboard Shortcuts',
    description: 'Press "?" to view all available keyboard shortcuts. Common shortcuts include: Space (play/pause), Escape (stop), Ctrl/Cmd+S (save), Ctrl/Cmd+K (AI chat), and Ctrl/Cmd+E (export MIDI).',
    position: 'center',
    actionLabel: 'Finish Tutorial',
  },
];
