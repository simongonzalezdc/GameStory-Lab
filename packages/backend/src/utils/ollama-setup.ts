/**
 * Ollama Setup Utility
 * Ensures Ollama is running and required models are available
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execAsync = promisify(exec);

// Use 127.0.0.1 instead of localhost to avoid IPv6 issues with multiple Ollama instances
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const REQUIRED_MODELS = [
  'qwen3:8b',  // Primary model - best balance
  'qwen3:4b',  // Fallback - faster
];

/**
 * Check if Ollama server is running
 */
async function isOllamaRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Start Ollama server
 */
async function startOllama(): Promise<boolean> {
  try {
    logger.info('Starting Ollama server...');
    
    // Check if Ollama is already running
    if (await isOllamaRunning()) {
      logger.info('Ollama is already running');
      return true;
    }

    // Try to start Ollama
    // On macOS, Ollama.app might be running, so we check first
    try {
      const { stdout } = await execAsync('pgrep -f "ollama serve"');
      if (stdout.trim()) {
        logger.info('Ollama process found, waiting for API to be ready...');
        // Wait a bit for API to be ready
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (await isOllamaRunning()) {
            logger.info('Ollama API is now ready');
            return true;
          }
        }
      }
    } catch {
      // No process found, continue to start
    }

    // Start Ollama in background (non-blocking)
    exec('ollama serve', (error) => {
      if (error) {
        logger.warn('Failed to start Ollama', { error: error.message });
      }
    });

    // Wait for Ollama to start (up to 10 seconds)
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (await isOllamaRunning()) {
        logger.info('Ollama server started successfully');
        return true;
      }
    }

    logger.warn('Ollama server did not start within timeout');
    return false;
  } catch (error) {
    logger.error('Error starting Ollama', { error });
    return false;
  }
}

/**
 * Check if a model is available via Ollama API
 */
async function isModelAvailable(modelName: string): Promise<boolean> {
  try {
    // First try to list models
    const listResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    
    if (listResponse.ok) {
      const data = await listResponse.json() as { models?: Array<{ name?: string } | string> };
      const models = data.models || [];
      const modelNames = models.map((m: any) => m.name || m);
      
      // Check if our model is in the list (exact match or contains)
      const found = modelNames.some((name: string) => 
        name === modelName || name.includes(modelName.split(':')[0])
      );
      
      if (found) {
        return true;
      }
    }

    // If list API doesn't show it, try a quick generate test
    // This handles cases where API list() returns empty but models exist
    try {
      const testResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: 'test',
          stream: false,
        }),
        signal: AbortSignal.timeout(3000),
      });

      // If we get a response (even if error), model exists
      // 404 specifically means model not found
      return testResponse.status !== 404;
    } catch {
      // If generate test fails, assume model doesn't exist
      return false;
    }
  } catch (error: any) {
    // Connection errors mean we can't check, assume not available
    return false;
  }
}

/**
 * Pull a model from Ollama registry
 * Note: If model already exists, ollama pull will be fast (just verifies)
 */
async function pullModel(modelName: string): Promise<boolean> {
  try {
    logger.info(`Ensuring Ollama model is available: ${modelName}...`);
    
    // Use ollama pull - it's idempotent (fast if model exists, downloads if not)
    const { stdout, stderr } = await execAsync(`ollama pull ${modelName}`, {
      timeout: 600000, // 10 minutes timeout for model download (models can be large)
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for output
    });

    // Check output for success indicators
    const output = (stdout + stderr).toLowerCase();
    if (output.includes('error') && !output.includes('already have')) {
      // If there's an error and it's not "already have", it might have failed
      logger.warn(`Potential issue pulling ${modelName}`, { stdout, stderr });
    }

    // Wait a moment for Ollama to register the model
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify model is now available
    const available = await isModelAvailable(modelName);
    if (available) {
      logger.info(`Model ${modelName} is available`);
      return true;
    } else {
      // Model might be available but API hasn't updated yet
      // Try one more time after a longer wait
      await new Promise(resolve => setTimeout(resolve, 5000));
      const retryAvailable = await isModelAvailable(modelName);
      if (retryAvailable) {
        logger.info(`Model ${modelName} is now available (after retry)`);
        return true;
      }
      logger.warn(`Model ${modelName} may not be accessible via API yet`);
      // Still return true if pull succeeded (model exists, API might just be slow)
      return !output.includes('error');
    }
  } catch (error: any) {
    // If error is timeout, model might still be downloading
    if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
      logger.warn(`Model ${modelName} pull timed out - it may still be downloading`);
      return false;
    }
    
    logger.error(`Failed to pull model ${modelName}`, { 
      error: error.message,
      code: error.code 
    });
    return false;
  }
}

/**
 * Check if model exists via CLI (more reliable than API)
 */
async function modelExistsViaCLI(modelName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`ollama list`, {
      timeout: 5000,
    });
    // Check if model name appears in the list
    return stdout.toLowerCase().includes(modelName.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Restart Ollama server to refresh model registry
 */
async function restartOllama(): Promise<boolean> {
  try {
    logger.info('Restarting Ollama to refresh model registry...');
    
    // Kill existing Ollama processes (but keep the main serve process)
    try {
      await execAsync('pkill -f "ollama runner"', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch {
      // Ignore errors - processes might not exist
    }

    // Wait for API to be ready again
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (await isOllamaRunning()) {
        logger.info('Ollama API is ready after restart');
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.warn('Error restarting Ollama', { error });
    return false;
  }
}

/**
 * Register a model with Ollama API by showing it (forces API to recognize it)
 */
async function registerModel(modelName: string): Promise<boolean> {
  try {
    logger.debug(`Registering model ${modelName} with Ollama API...`);
    await execAsync(`ollama show ${modelName}`, {
      timeout: 10000,
    });
    logger.debug(`Model ${modelName} registered via show`);
    
    // Try to warm up the model by running a tiny generation (forces Ollama to load it)
    try {
      const warmupResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: 'test',
          stream: false,
        }),
        signal: AbortSignal.timeout(10000),
      });
      
      if (warmupResponse.ok || warmupResponse.status === 404) {
        // Even if 404, the attempt might help Ollama recognize the model
        logger.debug(`Model ${modelName} warmup attempted`);
      }
    } catch {
      // Ignore warmup errors - model might not be accessible yet
    }
    
    return true;
  } catch (error) {
    logger.warn(`Failed to register model ${modelName}`, { error });
    return false;
  }
}

/**
 * Ensure required Ollama models are available
 */
async function ensureModelsAvailable(): Promise<string[]> {
  const availableModels: string[] = [];
  let needsRestart = false;
  const modelsToRegister: string[] = [];

  for (const model of REQUIRED_MODELS) {
    try {
      // First check via CLI (more reliable)
      const existsViaCLI = await modelExistsViaCLI(model);
      
      // Then check via API
      const availableViaAPI = await isModelAvailable(model);
      
      if (availableViaAPI) {
        logger.info(`Model ${model} is available via API`);
        availableModels.push(model);
      } else if (existsViaCLI) {
        logger.info(`Model ${model} exists locally but not accessible via API - will register and restart`);
        availableModels.push(model); // Add it anyway
        modelsToRegister.push(model);
        needsRestart = true;
      } else {
        logger.info(`Model ${model} not available, attempting to pull...`);
        const pulled = await pullModel(model);
        if (pulled) {
          availableModels.push(model);
          modelsToRegister.push(model);
          needsRestart = true; // After pulling, register and restart
        } else {
          logger.warn(`Model ${model} is not available and could not be pulled`);
        }
      }
    } catch (error) {
      logger.warn(`Error checking model ${model}`, { error });
    }
  }

  // Register models with API (forces Ollama to recognize them)
  if (modelsToRegister.length > 0) {
    logger.info(`Registering ${modelsToRegister.length} model(s) with Ollama API...`);
    for (const model of modelsToRegister) {
      await registerModel(model);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between registrations
    }
  }

  // If we pulled models or models exist but API doesn't see them, restart Ollama
  if (needsRestart && availableModels.length > 0) {
    logger.info('Restarting Ollama to make models accessible via API...');
    await restartOllama();
    
    // Verify models are now accessible
    const verifiedModels: string[] = [];
    for (const model of availableModels) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between checks
      const nowAvailable = await isModelAvailable(model);
      if (nowAvailable) {
        verifiedModels.push(model);
        logger.info(`Model ${model} is now accessible via API`);
      } else {
        // Even if API doesn't see it, if it exists via CLI, we'll try to use it
        // The orchestrator's retry mechanism will handle failures
        const stillExistsViaCLI = await modelExistsViaCLI(model);
        if (stillExistsViaCLI) {
          logger.info(`Model ${model} exists locally - will attempt to use it (API may be slow to update)`);
          verifiedModels.push(model);
        } else {
          logger.warn(`Model ${model} not accessible via API and not found via CLI`);
        }
      }
    }
    
    return verifiedModels.length > 0 ? verifiedModels : availableModels;
  }

  return availableModels;
}

/**
 * Initialize Ollama: ensure server is running and models are available
 */
export async function initializeOllama(): Promise<{
  serverRunning: boolean;
  availableModels: string[];
}> {
  logger.info('Initializing Ollama...');

  // Check if Ollama is running
  let serverRunning = await isOllamaRunning();
  
  if (!serverRunning) {
    logger.info('Ollama server is not running, attempting to start...');
    serverRunning = await startOllama();
  }

  if (!serverRunning) {
    logger.warn(
      'Ollama server is not running. ' +
      'Please start it manually: `ollama serve` or install Ollama from https://ollama.com'
    );
    return {
      serverRunning: false,
      availableModels: [],
    };
  }

  // Ensure required models are available
  const availableModels = await ensureModelsAvailable();

  if (availableModels.length === 0) {
    logger.warn(
      'No Ollama models are available. ' +
      'Please install at least one model: `ollama pull qwen3:8b`'
    );
  } else {
    logger.info(`Ollama initialized with ${availableModels.length} model(s): ${availableModels.join(', ')}`);
  }

  return {
    serverRunning: true,
    availableModels,
  };
}

