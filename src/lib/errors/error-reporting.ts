/**
 * Error Reporting Service Integration
 * Supports Sentry or similar error tracking service
 * 
 * To enable Sentry:
 * 1. Install: npm install @sentry/react
 * 2. Set VITE_SENTRY_DSN in .env
 * 3. Uncomment Sentry code below
 */

import type { AppError } from './error-handler';

// Uncomment when Sentry is installed:
// import * as Sentry from '@sentry/react';

let isInitialized = false;

/**
 * Initialize error reporting service
 * Call this once at app startup
 */
export function initErrorReporting(): void {
  if (isInitialized) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sentryDsn = (import.meta as any).env?.VITE_SENTRY_DSN;
  
  if (sentryDsn) {
    // Uncomment when Sentry is installed:
    // Sentry.init({
    //   dsn: sentryDsn,
    //   environment: (import.meta as any).env?.MODE || 'development',
    //   integrations: [
    //     Sentry.browserTracingIntegration(),
    //     Sentry.replayIntegration(),
    //   ],
    //   tracesSampleRate: 1.0,
    //   replaysSessionSampleRate: 0.1,
    //   replaysOnErrorSampleRate: 1.0,
    // });
    console.log('[Error Reporting] Sentry DSN found but Sentry not installed. Install @sentry/react to enable.');
  } else {
    console.log('[Error Reporting] Initialized (no Sentry DSN configured)');
  }

  isInitialized = true;
}

/**
 * Report error to external service
 */
export function reportError(error: AppError): void {
  // Uncomment when Sentry is installed:
  // Sentry.captureException(new Error(error.message), {
  //   level: mapSeverityToSentryLevel(error.severity),
  //   tags: {
  //     context: error.context || 'Unknown',
  //   },
  //   extra: {
  //     id: error.id,
  //     timestamp: error.timestamp,
  //     recoverable: error.recoverable,
  //     details: error.details,
  //   },
  // });

  // Log in production for now (will send to Sentry when configured)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isProduction = (import.meta as any).env?.MODE === 'production';
  
  if (isProduction || error.severity === 'critical' || error.severity === 'error') {
    console.error('[Error Reporting]', {
      id: error.id,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
      recoverable: error.recoverable,
    });
  }
}

/**
 * Map internal severity to Sentry level
 * @internal - Used when integrating Sentry
 * @unused - Reserved for future Sentry integration
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore - Reserved for future use
function mapSeverityToSentryLevel(severity: string): 'info' | 'warning' | 'error' | 'fatal' {
  switch (severity) {
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'critical':
      return 'fatal';
    default:
      return 'error';
  }
}

