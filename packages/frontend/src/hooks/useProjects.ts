/**
 * React Query hooks for Projects API
 * Provides caching, automatic refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../services/api';

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Hook to fetch all projects with caching
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => projectsAPI.list(),
  });
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsAPI.get(id),
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * Hook to create a new project
 * Automatically invalidates project list cache
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; genre?: string }) =>
      projectsAPI.create(data),
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook to update a project
 * Automatically invalidates related caches
 */
export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; genre?: string }) =>
      projectsAPI.update(id, data),
    onSuccess: () => {
      // Invalidate both the specific project and the list
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook to delete a project
 * Automatically removes from cache
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsAPI.delete(id),
    onSuccess: (_, id) => {
      // Remove the deleted project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook to merge project versions
 */
export function useMergeProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectsAPI.merge(id),
    onSuccess: () => {
      // Invalidate the project to refetch updated data
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}
