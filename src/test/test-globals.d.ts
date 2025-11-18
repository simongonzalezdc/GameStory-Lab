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

  // Define FileSystem API types that are missing in test environment
  interface FileSystemDirectoryHandle {
    kind: 'directory';
    name: string;
  }

  interface FileSystemFileHandle {
    kind: 'file';
    name: string;
  }
}

// Mock class for AudioContext in tests
export class MockAudioContext {
  constructor();
}
