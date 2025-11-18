/**
 * Performance monitoring using Web Vitals
 * Tracks core web vitals metrics for production optimization
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Report web vitals metrics
 * In production, this could send to an analytics service
 */
function reportMetric(metric: Metric) {
  // Log in development mode
  if (import.meta.env.MODE === 'development') {
    console.info('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // In production, send to analytics service
  // Example: sendToAnalytics(metric)

  // Could also store in localStorage for debugging
  try {
    const vitals = JSON.parse(localStorage.getItem('webVitals') || '[]');
    vitals.push({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: new Date().toISOString(),
    });
    // Keep only last 20 metrics
    localStorage.setItem('webVitals', JSON.stringify(vitals.slice(-20)));
  } catch (error) {
    // Ignore storage errors
  }
}

/**
 * Initialize performance monitoring
 * Tracks all core web vitals
 */
export function initPerformanceMonitoring() {
  // Cumulative Layout Shift - measures visual stability
  onCLS(reportMetric);

  // Interaction to Next Paint - measures interactivity (replaces FID)
  onINP(reportMetric);

  // First Contentful Paint - measures perceived load speed
  onFCP(reportMetric);

  // Largest Contentful Paint - measures loading performance
  onLCP(reportMetric);

  // Time to First Byte - measures server response time
  onTTFB(reportMetric);
}

/**
 * Get stored web vitals from localStorage
 */
export function getStoredWebVitals() {
  try {
    return JSON.parse(localStorage.getItem('webVitals') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored web vitals
 */
export function clearWebVitals() {
  localStorage.removeItem('webVitals');
}
