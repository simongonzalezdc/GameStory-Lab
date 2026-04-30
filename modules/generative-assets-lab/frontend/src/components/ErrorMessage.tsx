import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  suggestion?: string;
}

export function ErrorMessage({ error, onRetry, suggestion }: ErrorMessageProps) {
  // Parse error message and provide helpful suggestions
  const getSuggestion = () => {
    if (suggestion) return suggestion;

    const errorLower = error.toLowerCase();

    if (errorLower.includes('api key') || errorLower.includes('unauthorized')) {
      return 'Check your API keys in the backend .env file. Make sure they are valid and have available credits.';
    }

    if (errorLower.includes('rate limit') || errorLower.includes('429')) {
      return 'You\'ve hit the API rate limit. Wait a few minutes and try again, or switch to a different AI model.';
    }

    if (errorLower.includes('quota') || errorLower.includes('exceeded')) {
      return 'Your API quota has been exceeded. Check your account credits or try a different provider.';
    }

    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'The request timed out. The AI service might be slow. Try again or reduce image complexity.';
    }

    if (errorLower.includes('content policy') || errorLower.includes('safety')) {
      return 'Your prompt was flagged by content filters. Try rephrasing with different words.';
    }

    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'Network connection issue. Check your internet connection and try again.';
    }

    if (errorLower.includes('ollama')) {
      return 'Ollama is not running or not installed. Start Ollama with "ollama serve" or switch to a cloud model.';
    }

    return 'An unexpected error occurred. Try again or contact support if the issue persists.';
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-red-900 dark:text-red-300">Error</p>
          <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>

          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded p-3 mt-2">
            <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">💡 Suggestion:</p>
            <p className="text-sm text-red-800 dark:text-red-400">{getSuggestion()}</p>
          </div>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
