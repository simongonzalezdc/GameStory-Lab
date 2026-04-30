/**
 * Privacy-respecting analytics service
 * Placeholder for analytics integration (e.g., Plausible, PostHog, or custom)
 */

/**
 * Initialize analytics service
 */
export function initAnalytics(): void {
  // TODO: Initialize analytics service
  // Example for Plausible:
  // if (import.meta.env.PROD && import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
  //   const script = document.createElement('script');
  //   script.defer = true;
  //   script.dataset.domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  //   script.src = 'https://plausible.io/js/script.js';
  //   document.head.appendChild(script);
  // }
  
  // Example for PostHog:
  // if (import.meta.env.PROD && import.meta.env.VITE_POSTHOG_KEY) {
  //   posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  //     api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
  //   });
  // }
}

/**
 * Track an event
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  // TODO: Send to analytics service
  // Example for Plausible:
  // if (typeof window !== 'undefined' && window.plausible) {
  //   window.plausible(eventName, { props: properties });
  // }

  // Example for PostHog:
  // if (typeof window !== 'undefined' && window.posthog) {
  //   window.posthog.capture(eventName, properties);
  // }

  // For now, just log in development
  if (import.meta.env.MODE === 'development') {
    console.log('[Analytics]', eventName, properties);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  trackEvent('page_view', { path });
}

/**
 * Track user action
 */
export function trackAction(action: string, details?: Record<string, unknown>): void {
  trackEvent('user_action', {
    action,
    ...details,
  });
}

/**
 * Common event tracking functions
 */
export const analytics = {
  // Project events
  projectCreated: (name: string) => trackEvent('project_created', { name }),
  projectExported: (format: string) => trackEvent('project_exported', { format }),
  projectLoaded: () => trackEvent('project_loaded'),
  
  // Scene events
  sceneCreated: () => trackEvent('scene_created'),
  sceneDeleted: () => trackEvent('scene_deleted'),
  scenePlayed: () => trackEvent('scene_played'),
  
  // Track events
  trackAdded: (role: string) => trackEvent('track_added', { role }),
  trackDeleted: () => trackEvent('track_deleted'),
  
  // Clip events
  clipAdded: (generatorType: string) => trackEvent('clip_added', { generatorType }),
  clipDeleted: () => trackEvent('clip_deleted'),
  
  // Generator events
  generatorUsed: (type: string, preset?: string) => trackEvent('generator_used', { type, preset }),
  
  // AI events
  aiMessageSent: () => trackEvent('ai_message_sent'),
  aiActionApplied: (actionType: string) => trackEvent('ai_action_applied', { actionType }),
  
  // Tutorial events
  tutorialStarted: () => trackEvent('tutorial_started'),
  tutorialCompleted: () => trackEvent('tutorial_completed'),
  tutorialSkipped: () => trackEvent('tutorial_skipped'),
  
  // Export events
  midiExported: () => trackEvent('midi_exported'),
  projectSaved: () => trackEvent('project_saved'),
  
  // Error events (non-sensitive)
  errorOccurred: (severity: string) => trackEvent('error_occurred', { severity }),
};

