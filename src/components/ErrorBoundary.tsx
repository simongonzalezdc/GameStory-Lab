import React, { Component, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Log to error reporting service (future implementation)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo): void {
    // Send to error reporting service
    import('@/lib/errors/error-reporting').then(({ reportError }) => {
      import('@/lib/errors/error-handler').then(({ errorHandler, ErrorSeverity }) => {
        const appError = errorHandler.handle(error, 'ErrorBoundary', ErrorSeverity.CRITICAL);
        reportError({
          ...appError,
          details: errorInfo.componentStack || undefined,
        });
      });
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600">
                We're sorry, but an unexpected error occurred. The error has been logged.
              </p>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-40">
                    <div className="font-bold mb-1">{this.state.error.message}</div>
                    <div className="text-gray-600">{this.state.error.stack}</div>
                  </div>
                </details>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={this.handleReset} className="w-full">
                Reload Application
              </Button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                Go to Home
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500 text-center">
              <p>
                If this problem persists, please try clearing your browser cache or contact
                support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
