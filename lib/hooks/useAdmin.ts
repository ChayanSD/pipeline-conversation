import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { User } from '../types';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  users: (limit?: number) => [...adminKeys.all, 'users', { limit }] as const,
};

// Get all users (admin only)
export function useAllUsers(limit?: number) {
  return useQuery({
    queryKey: adminKeys.users(limit),
    queryFn: async () => {
      const params = limit ? { limit: limit.toString() } : undefined;
      const response = await apiClient.get<{ users: User[]; total: number }>(
        '/admin/all-users',
        { params }
      );
      return response;
    },
  });
}

