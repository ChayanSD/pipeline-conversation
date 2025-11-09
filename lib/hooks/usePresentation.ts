import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { Presentation } from '../types';

// Query keys
export const presentationKeys = {
  all: ['presentations'] as const,
  lists: () => [...presentationKeys.all, 'list'] as const,
  list: (filters: string) => [...presentationKeys.lists(), { filters }] as const,
  details: () => [...presentationKeys.all, 'detail'] as const,
  detail: (id: string) => [...presentationKeys.details(), id] as const,
};

// Get all presentations
export function usePresentations() {
  return useQuery({
    queryKey: presentationKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ presentations: Presentation[] }>('/presentation');
      return response.presentations;
    },
  });
}

// Get presentation by ID
export function usePresentation(id: string | null) {
  return useQuery({
    queryKey: presentationKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Presentation ID is required');
      const response = await apiClient.get<{ presentation: Presentation }>(`/presentation/${id}`);
      return response.presentation;
    },
    enabled: !!id,
  });
}

// Create presentation
export function useCreatePresentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; title: string }) => {
      const response = await apiClient.post<Presentation>('/presentation', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: presentationKeys.lists() });
    },
  });
}

// Update presentation
export function useUpdatePresentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ title: string }> }) => {
      const response = await apiClient.patch<{ presentation: Presentation }>(`/presentation/${id}`, data);
      return response.presentation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: presentationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: presentationKeys.detail(variables.id) });
    },
  });
}

// Delete presentation
export function useDeletePresentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/presentation/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: presentationKeys.lists() });
    },
  });
}

