import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { User } from '../types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  check: () => [...authKeys.all, 'check'] as const,
};

// Check authentication
export function useAuthCheck() {
  return useQuery({
    queryKey: authKeys.check(),
    queryFn: async () => {
      const response = await apiClient.get<{ authenticated: boolean; user?: User }>(
        '/auth/check'
      );
      return response;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Login
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; passCode: string }) => {
      const response = await apiClient.post<{ success: boolean; role?: string }>(
        '/auth/login',
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.check() });
    },
  });
}

// Logout
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.check() });
      queryClient.clear();
    },
  });
}

// Register
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email?: string;
      passCode: string;
      inviteToken?: string;
      companyName?: string;
      primaryColor?: string;
      secondaryColor?: string;
      profileImageUrl?: string;
      companyLogoUrl?: string;
    }) => {
      const response = await apiClient.post<{ success: boolean }>('/auth/register', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.check() });
    },
  });
}

