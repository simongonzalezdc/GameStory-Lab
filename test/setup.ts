import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
process.env.DATABASE_URL = ':memory:';
process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
