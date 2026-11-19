/**
 * Tests for the OLLAMA_AUTO_PULL opt-in gate (defect D2, card t_4d397065):
 * unattended `ollama pull` must be disabled unless explicitly enabled.
 *
 * The same gate also covers the Ollama *restart* (D7 hardening): restarting
 * used to `pkill -f "ollama runner"`, which on a shared host terminates the
 * model runners of other users' in-flight generations.
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';

const { execMock } = vi.hoisted(() => ({ execMock: vi.fn() }));

vi.mock('child_process', () => {
  const customPromisify = Symbol.for('nodejs.util.promisify.custom');
  const exec: unknown = (cmd: string, opts: unknown, cb?: unknown) => {
    const callback = typeof opts === 'function' ? opts : cb;
    const result = execMock(cmd, opts);
    if (typeof callback === 'function') {
      result.then(
        (r: { stdout: string; stderr: string }) => callback(null, r.stdout, r.stderr),
        (e: unknown) => callback(e, '', ''),
      );
    }
    return result;
  };
  (exec as Record<symbol, unknown>)[customPromisify] = (cmd: string, opts: unknown) => execMock(cmd, opts);
  return {
    exec,
    execSync: vi.fn(),
    spawn: vi.fn(),
    spawnSync: vi.fn(),
  };
});

import { isOllamaAutoPullEnabled, initializeOllama } from './ollama-setup.js';

describe('isOllamaAutoPullEnabled (D2, card t_4d397065)', () => {
  const original = process.env.OLLAMA_AUTO_PULL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.OLLAMA_AUTO_PULL;
    } else {
      process.env.OLLAMA_AUTO_PULL = original;
    }
  });

  it('is disabled by default (env var absent)', () => {
    delete process.env.OLLAMA_AUTO_PULL;
    expect(isOllamaAutoPullEnabled()).toBe(false);
  });

  it('is enabled with OLLAMA_AUTO_PULL=1', () => {
    process.env.OLLAMA_AUTO_PULL = '1';
    expect(isOllamaAutoPullEnabled()).toBe(true);
  });

  it('is enabled with OLLAMA_AUTO_PULL=true', () => {
    process.env.OLLAMA_AUTO_PULL = 'true';
    expect(isOllamaAutoPullEnabled()).toBe(true);
  });

  it('rejects arbitrary truthy-looking values (strict opt-in)', () => {
    for (const value of ['0', 'false', 'yes', 'on', ' ']) {
      process.env.OLLAMA_AUTO_PULL = value;
      expect(isOllamaAutoPullEnabled()).toBe(false);
    }
  });
});

/**
 * D7 hardening (card t_4d397065): the Ollama restart used to run
 * `pkill -f "ollama runner"`. On a shared host that kills the model runners
 * of OTHER users' in-flight generations, so the kill must not happen unless
 * the operator explicitly opted in.
 */
describe('Ollama restart never kills processes without explicit opt-in (D7, card t_4d397065)', () => {
  const originalAutoPull = process.env.OLLAMA_AUTO_PULL;
  const originalFetch = globalThis.fetch;
  let generateCalls = 0;

  const commandsRun = () => execMock.mock.calls.map((c) => String(c[0]));

  beforeEach(() => {
    vi.clearAllMocks();
    generateCalls = 0;
    // The code path has real 1-2s waits; fake timers keep the test fast.
    vi.useFakeTimers();

    // `ollama list` reports qwen3:8b as installed locally.
    execMock.mockImplementation((cmd: string) => {
      if (String(cmd).startsWith('ollama list')) {
        return Promise.resolve({ stdout: 'NAME    ID    SIZE\nqwen3:8b    abc123    5GB\n', stderr: '' });
      }
      return Promise.resolve({ stdout: '', stderr: '' });
    });

    // The model is NOT reachable through the API, which is exactly the
    // condition that used to trigger the restart (and the pkill).
    globalThis.fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/api/tags')) {
        return { ok: true, status: 200, json: async () => ({ models: [] }) } as unknown as Response;
      }
      if (String(url).includes('/api/generate')) {
        generateCalls += 1;
        // First probe = availability check (model absent -> 404).
        // Later calls = registerModel warmup (succeeds).
        const status = generateCalls === 1 ? 404 : 200;
        return { ok: status === 200, status, json: async () => ({}) } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
    if (originalAutoPull === undefined) {
      delete process.env.OLLAMA_AUTO_PULL;
    } else {
      process.env.OLLAMA_AUTO_PULL = originalAutoPull;
    }
  });

  /** Run initializeOllama() to completion under fake timers. */
  const runInit = async () => {
    const pending = initializeOllama();
    await vi.advanceTimersByTimeAsync(120_000);
    await pending;
  };

  it('does not run pkill when automatic Ollama management is off (default)', async () => {
    delete process.env.OLLAMA_AUTO_PULL;

    await runInit();

    const kills = commandsRun().filter((c) => c.includes('pkill'));
    expect(kills).toEqual([]);
  });

  it('does not run pkill for any truthy-looking opt-in value', async () => {
    for (const value of ['0', 'false', 'yes', 'on']) {
      vi.clearAllMocks();
      generateCalls = 0;
      process.env.OLLAMA_AUTO_PULL = value;

      await runInit();

      const kills = commandsRun().filter((c) => c.includes('pkill'));
      expect(kills).toEqual([]);
    }
  });

  it('runs pkill only when the operator explicitly opted in (proves the gate is the deciding factor)', async () => {
    process.env.OLLAMA_AUTO_PULL = '1';

    await runInit();

    const kills = commandsRun().filter((c) => c.includes('pkill'));
    expect(kills.length).toBeGreaterThan(0);
  });
});
