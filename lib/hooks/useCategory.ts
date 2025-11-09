import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { Category } from '../types';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: string) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

// Get all categories
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ categories: Category[] }>('/category');
      return response.categories;
    },
  });
}

// Get category by ID
export function useCategory(id: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Category ID is required');
      const response = await apiClient.get<{ category: Category }>(`/category/${id}`);
      return response.category;
    },
    enabled: !!id,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { presentationId: string; name: string }) => {
      const response = await apiClient.post<Category>('/category', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string }> }) => {
      const response = await apiClient.patch<{ category: Category }>(`/category/${id}`, data);
      return response.category;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/category/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

