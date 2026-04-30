/**
 * Window object extensions for analytics and third-party integrations
 */

declare global {
  interface Window {
    // Analytics providers (optional, may not be present in production)
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export {};
