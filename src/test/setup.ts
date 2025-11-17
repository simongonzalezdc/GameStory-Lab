import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API
global.AudioContext = class MockAudioContext {} as typeof AudioContext;

// Mock getUserMedia for microphone tests
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve({} as MediaStream),
  },
  writable: true,
});

// Mock File System Access API
if (typeof window !== 'undefined') {
  (window as any).showDirectoryPicker = () =>
    Promise.resolve({
      getFileHandle: () => Promise.resolve({}),
    });
}
