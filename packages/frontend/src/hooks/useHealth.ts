/**
 * React Query hook for Health API
 * Provides automatic polling and caching for health status
 */

import { useQuery } from '@tanstack/react-query';
import { healthAPI } from '../services/api';

// Query keys
export const healthKeys = {
  status: ['health', 'status'] as const,
};

/**
 * Hook to fetch health status with automatic polling
 * Refetches every 30 seconds by default
 */
export function useHealth(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: healthKeys.status,
    queryFn: () => healthAPI.check(),
    refetchInterval: options?.refetchInterval ?? 30000, // Poll every 30s by default
    staleTime: 10000, // Consider data stale after 10s
  });
}
