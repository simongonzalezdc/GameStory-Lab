import { useEffect, useState } from 'react';
import { errorHandler, type AppError, ErrorSeverity } from '@/lib/errors/error-handler';

export default function ErrorNotification() {
  const [errors, setErrors] = useState<AppError[]>([]);

  useEffect(() => {
    const unsubscribe = errorHandler.subscribe((error) => {
      setErrors((prev) => [...prev, error]);

      // Auto-dismiss after delay based on severity
      const dismissDelay = error.severity === ErrorSeverity.CRITICAL ? 10000 : 5000;
      setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== error.id));
      }, dismissDelay);
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  };

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`rounded-lg shadow-lg p-4 animate-slide-in ${getSeverityStyles(
            error.severity
          )}`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">
              {getSeverityIcon(error.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-1">{getSeverityLabel(error.severity)}</div>
              <div className="text-sm">{error.userMessage}</div>
              {error.details && (
                <details className="mt-2 text-xs opacity-75">
                  <summary className="cursor-pointer hover:opacity-100">Details</summary>
                  <div className="mt-1 font-mono">{error.message}</div>
                </details>
              )}
            </div>
            <button
              onClick={() => handleDismiss(error.id)}
              className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getSeverityStyles(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'bg-blue-50 text-blue-900 border border-blue-200';
    case ErrorSeverity.WARNING:
      return 'bg-yellow-50 text-yellow-900 border border-yellow-200';
    case ErrorSeverity.ERROR:
      return 'bg-red-50 text-red-900 border border-red-200';
    case ErrorSeverity.CRITICAL:
      return 'bg-red-600 text-white border border-red-700';
    default:
      return 'bg-gray-50 text-gray-900 border border-gray-200';
  }
}

function getSeverityIcon(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'ℹ️';
    case ErrorSeverity.WARNING:
      return '⚠️';
    case ErrorSeverity.ERROR:
      return '❌';
    case ErrorSeverity.CRITICAL:
      return '🚨';
    default:
      return '📢';
  }
}

function getSeverityLabel(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'Information';
    case ErrorSeverity.WARNING:
      return 'Warning';
    case ErrorSeverity.ERROR:
      return 'Error';
    case ErrorSeverity.CRITICAL:
      return 'Critical Error';
    default:
      return 'Notification';
  }
}
