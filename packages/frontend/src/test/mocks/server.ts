/**
 * MSW Server setup for testing
 */

import { setupServer } from 'msw/browser';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { handlers } from './handlers';

// Setup requests interception using the given handlers
export const server = setupServer(...handlers);

// Enable API mocking before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests are done
afterAll(() => server.close());
