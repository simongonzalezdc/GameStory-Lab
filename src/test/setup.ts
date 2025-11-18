/// <reference path="./test-globals.d.ts" />

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API (in browser environment only)
if (typeof window !== 'undefined') {
  // Test-only mock - extends Window interface via test-globals.d.ts
  window.AudioContext = class MockAudioContext {} as any;

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

  // Mock File System Access API - test-only mocks
  window.showDirectoryPicker = () =>
    Promise.resolve({
      getFileHandle: () => Promise.resolve({}),
    } as any);

  window.showOpenFilePicker = () =>
    Promise.resolve([{
      getFile: () => Promise.resolve(new File([], 'test.json')),
    }] as any);

  window.showSaveFilePicker = () =>
    Promise.resolve({
      createWritable: () => Promise.resolve({
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
      }),
    } as any);
}
