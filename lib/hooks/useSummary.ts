import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { SummaryCreateData, SummaryUpdateData } from '@/validation/summary.validation';

// Query keys
export const summaryKeys = {
  all: ['summaries'] as const,
  detail: (presentationId: string) => [...summaryKeys.all, 'detail', presentationId] as const,
};

// Get summary by presentation ID
export function useSummary(presentationId: string | null) {
  return useQuery<{ success: boolean; data: { summary: any; categories: any[] } }>({
    queryKey: summaryKeys.detail(presentationId || ''),
    queryFn: async () => {
      if (!presentationId) throw new Error('Presentation ID is required');
      const response = await apiClient.get<{ success: boolean; data: { summary: any; categories: any[] } }>(
        `/summary/${presentationId}`
      );
      return response.data; // This returns { success: true, data: { summary, categories } }
    },
    enabled: !!presentationId,
  });
}

// Create summary
export function useCreateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ presentationId, data }: { presentationId: string; data: SummaryCreateData }) => {
      const response = await apiClient.post<{ data: any }>(`/summary/${presentationId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: summaryKeys.detail(variables.presentationId) });
    },
  });
}

// Update summary
export function useUpdateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ presentationId, data }: { presentationId: string; data: SummaryUpdateData }) => {
      const response = await apiClient.patch<{ data: any }>(`/summary/${presentationId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: summaryKeys.detail(variables.presentationId) });
    },
  });
}

