import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { User } from '../types';

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
};

// Get current user profile
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const response = await apiClient.get<{ user: User }>('/profile');
      return response.user;
    },
  });
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData | Partial<User>) => {
      const response = await apiClient.patch<{ user: User }>('/profile', data);
      return response.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      queryClient.invalidateQueries({ queryKey: ['auth', 'check'] });
    },
  });
}

