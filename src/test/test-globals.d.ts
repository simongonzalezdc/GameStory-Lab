/**
 * Test-only global type extensions
 * These mocks are not part of the production Window interface
 */

declare global {
  interface Window {
    // Web Audio API mock for tests
    AudioContext: typeof MockAudioContext;

    // File System Access API mocks for tests
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker: () => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker: () => Promise<FileSystemFileHandle>;
  }
}

// Mock class for AudioContext in tests
declare class MockAudioContext {
  constructor();
}

export {};
