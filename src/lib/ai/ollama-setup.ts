/**
 * Ollama Setup and Health Check Utilities
 * Ensures Ollama is properly configured before use
 */

import type { LocalConfig } from '@/types';

export interface OllamaStatus {
  isRunning: boolean;
  isModelAvailable: boolean;
  availableModels: string[];
  error?: string;
}

/**
 * Check if Ollama server is running
 */
export async function checkOllamaRunning(baseURL: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseURL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get list of available models from Ollama
 */
export async function getAvailableModels(baseURL: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseURL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (data.models && Array.isArray(data.models)) {
      return data.models.map((model: any) => model.name || model.model || '').filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Check if a specific model is available
 */
export async function checkModelAvailable(baseURL: string, modelName: string): Promise<boolean> {
  const models = await getAvailableModels(baseURL);
  return models.includes(modelName);
}

/**
 * Pull/download a model if it's not available
 * Returns progress information
 */
export async function pullModel(
  baseURL: string, 
  modelName: string,
  onProgress?: (progress: { status: string; completed?: number; total?: number }) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${baseURL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: modelName,
        stream: true, // Enable streaming to track progress
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    // Read the stream to track progress
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      return { success: false, error: 'No response body' };
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (onProgress) {
            onProgress({
              status: data.status || 'downloading',
              completed: data.completed,
              total: data.total,
            });
          }
        } catch {
          // Ignore parse errors for non-JSON lines
        }
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Comprehensive Ollama status check
 */
export async function checkOllamaStatus(config: LocalConfig): Promise<OllamaStatus> {
  const status: OllamaStatus = {
    isRunning: false,
    isModelAvailable: false,
    availableModels: [],
  };

  try {
    // Check if Ollama is running
    status.isRunning = await checkOllamaRunning(config.baseURL);

    if (!status.isRunning) {
      status.error = `Ollama is not running at ${config.baseURL}. Please start Ollama first.`;
      return status;
    }

    // Get available models
    status.availableModels = await getAvailableModels(config.baseURL);

    if (status.availableModels.length === 0) {
      status.error = 'Ollama is running but no models are available. Please download a model first.';
      return status;
    }

    // Check if the configured model is available
    status.isModelAvailable = await checkModelAvailable(config.baseURL, config.model);

    if (!status.isModelAvailable) {
      status.error = `Model '${config.model}' is not available. Available models: ${status.availableModels.join(', ')}`;
    }

    return status;
  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown error checking Ollama status';
    return status;
  }
}

/**
 * Setup Ollama - check status, auto-download missing models, and provide helpful error messages
 */
export async function setupOllama(
  config: LocalConfig,
  autoPull: boolean = true
): Promise<{ success: boolean; message: string }> {
  const status = await checkOllamaStatus(config);

  if (!status.isRunning) {
    return {
      success: false,
      message: `Ollama is not running at ${config.baseURL}.\n\nTo start Ollama:\n1. Install Ollama from https://ollama.ai\n2. Run: ollama serve\n3. Or start Ollama from your applications folder`,
    };
  }

  if (status.availableModels.length === 0) {
    if (autoPull) {
      // Try to pull the default model
      const pullResult = await pullModel(config.baseURL, config.model);
      if (pullResult.success) {
        return {
          success: true,
          message: `Model '${config.model}' downloaded successfully!\nServer: ${config.baseURL}\nModel: ${config.model}`,
        };
      }
      return {
        success: false,
        message: `Failed to download model '${config.model}': ${pullResult.error || 'Unknown error'}\n\nPlease download manually:\n1. Run: ollama pull ${config.model}\n2. Or visit: https://ollama.ai/library`,
      };
    }
    return {
      success: false,
      message: `Ollama is running but no models are available.\n\nTo download a model:\n1. Run: ollama pull ${config.model}\n2. Or download from: https://ollama.ai/library`,
    };
  }

  if (!status.isModelAvailable) {
    if (autoPull) {
      // Try to pull the missing model
      const pullResult = await pullModel(config.baseURL, config.model);
      if (pullResult.success) {
        return {
          success: true,
          message: `Model '${config.model}' downloaded successfully!\nServer: ${config.baseURL}\nModel: ${config.model}`,
        };
      }
      const suggestedModel = status.availableModels[0] || 'llama3.1';
      return {
        success: false,
        message: `Failed to download model '${config.model}': ${pullResult.error || 'Unknown error'}\n\nAvailable models: ${status.availableModels.join(', ')}\n\nTo download manually:\n1. Run: ollama pull ${config.model}\n\nOr use an available model: ${suggestedModel}`,
      };
    }
    const suggestedModel = status.availableModels[0] || 'llama3.1';
    return {
      success: false,
      message: `Model '${config.model}' is not available.\n\nAvailable models: ${status.availableModels.join(', ')}\n\nTo download the model:\n1. Run: ollama pull ${config.model}\n\nOr use an available model: ${suggestedModel}`,
    };
  }

  return {
    success: true,
    message: `Ollama is configured correctly!\nServer: ${config.baseURL}\nModel: ${config.model}`,
  };
}
