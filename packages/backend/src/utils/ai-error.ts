/**
 * Shared AI error envelope (defects D1/D7, card t_4d397065)
 *
 * Every AI-backed route reports failures in the same shape:
 *   HTTP 500 { "error": "<user-friendly, actionable message>",
 *              "details": "<original error message, development only>" }
 *
 * The user-friendly message names providers and concrete next steps, and never
 * advises destructive commands (D7: no `pkill -9 ollama` against shared
 * Ollama daemons).
 */

/**
 * Extract a human-readable message from any error shape.
 * Handles: Error instances, plain "AIClientError" objects thrown by the AI
 * clients ({ name, message, provider, originalError }), nested
 * { error: { message } } wrappers, and everything else.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: unknown; error?: unknown };
    const directMessage = typeof err.message === 'string' && err.message ? err.message : undefined;
    const nestedError = err.error && typeof err.error === 'object' ? (err.error as { message?: unknown }) : undefined;
    const nestedMessage =
      nestedError && typeof nestedError.message === 'string' && nestedError.message ? nestedError.message : undefined;
    const resolved = directMessage ?? nestedMessage;
    if (resolved) {
      return resolved;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

/**
 * Turn an underlying AI failure message into an actionable, provider-naming
 * message. Non-destructive advice only (D7).
 */
export function buildUserFriendlyAiErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  const modelMissing = lower.includes('model') && (lower.includes('not found') || lower.includes('not accessible'));
  if (modelMissing) {
    return (
      'The configured Ollama models are not installed or not visible to the Ollama API. ' +
      'Check OLLAMA_BASE_URL in .env, then install a model manually with `ollama pull qwen3:8b` ' +
      '(or set OLLAMA_AUTO_PULL=1 in .env to let the server pull models automatically). ' +
      'Alternatively configure a cloud provider in .env: MINIMAX_API_KEY, GLM_API_KEY, ' +
      'OPENROUTER_API_KEY or GOOGLE_API_KEY.'
    );
  }

  if (lower.includes('no ai clients available') || lower.includes('no ai provider')) {
    return (
      'No AI providers are available. Configure at least one in .env: ' +
      'MINIMAX_API_KEY, GLM_API_KEY, OPENROUTER_API_KEY or GOOGLE_API_KEY, ' +
      'or run a local Ollama daemon with at least one model installed (`ollama pull qwen3:8b`).'
    );
  }

  return message;
}

export interface AiErrorPayload {
  error: string;
  details?: string;
}

/**
 * Build the unified AI-unavailable response payload (D1).
 * `details` carries the original message in development only.
 */
export function toAiErrorPayload(error: unknown): AiErrorPayload {
  const originalMessage = extractErrorMessage(error);
  const payload: AiErrorPayload = {
    error: buildUserFriendlyAiErrorMessage(originalMessage),
  };
  if (process.env.NODE_ENV === 'development') {
    payload.details = originalMessage;
  }
  return payload;
}
