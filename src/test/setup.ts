import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API (in browser environment only)
if (typeof window !== 'undefined') {
  (window as any).AudioContext = class MockAudioContext {};

  // Mock getUserMedia for microphone tests
  if (!window.navigator.mediaDevices) {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => Promise.resolve({} as MediaStream),
      },
      writable: true,
      configurable: true,
    });
  }

  // Mock File System Access API
  (window as any).showDirectoryPicker = () =>
    Promise.resolve({
      getFileHandle: () => Promise.resolve({}),
    });

  (window as any).showOpenFilePicker = () =>
    Promise.resolve([{
      getFile: () => Promise.resolve(new File([], 'test.json')),
    }]);

  (window as any).showSaveFilePicker = () =>
    Promise.resolve({
      createWritable: () => Promise.resolve({
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
      }),
    });
}
