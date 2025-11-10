import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { Presentation } from '../types';
import { AuditCreateData } from '@/validation/audit.validation';

// Query keys
export const auditKeys = {
  all: ['audits'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: string) => [...auditKeys.lists(), { filters }] as const,
  details: () => [...auditKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
};

// Get all audits
export function useAudits() {
  return useQuery({
    queryKey: auditKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Presentation[]; isInvitedUser?: boolean }>('/audit');
      return response;
    },
  });
}

// Get audit by ID
export function useAudit(id: string | null) {
  return useQuery({
    queryKey: auditKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Audit ID is required');
      const response = await apiClient.get<{ presentation: Presentation }>(`/presentation/${id}`);
      return response.presentation;
    },
    enabled: !!id,
  });
}

// Create audit
export function useCreateAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AuditCreateData) => {
      const response = await apiClient.post<{ data: Presentation }>('/audit', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
    },
  });
}

// Update audit
export function useUpdateAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AuditCreateData }) => {
      const response = await apiClient.patch<{ data: Presentation }>(`/audit/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditKeys.detail(variables.id) });
    },
  });
}

// Delete audit
export function useDeleteAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/presentation/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
    },
  });
}

