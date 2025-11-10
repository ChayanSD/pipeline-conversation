import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../fetcher';

// Query keys
export const inviteKeys = {
  all: ['invites'] as const,
  detail: (token: string) => [...inviteKeys.all, token] as const,
};

// Get invite by token
export function useInvite(token: string | null) {
  return useQuery({
    queryKey: inviteKeys.detail(token || ''),
    queryFn: async () => {
      if (!token) throw new Error('Token is required');
      const response = await apiClient.get<{ data: unknown }>('/invite', {
        params: { token },
      });
      console.log(response);
      return response.data;
    },
    enabled: !!token,
  });
}

// Send invite
export function useSendInvite() {
  return useMutation({
    mutationFn: async (data: { email: string; companyId: string; invitedById: string; role?: string }) => {
      const response = await apiClient.post<{ success: boolean; message?: string }>(
        '/invite',
        data
      );
      return response;
    },
  });
}

// Send audit invitation
export function useSendAuditInvite() {
  return useMutation({
    mutationFn: async (data: { email: string; presentationId: string }) => {
      const response = await apiClient.post<{ success: boolean; message?: string }>(
        '/invite/audit',
        data
      );
      return response;
    },
  });
}

