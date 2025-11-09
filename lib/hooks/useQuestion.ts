import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { Question } from '../types';

// Query keys
export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (filters: string) => [...questionKeys.lists(), { filters }] as const,
  details: () => [...questionKeys.all, 'detail'] as const,
  detail: (id: string) => [...questionKeys.details(), id] as const,
};

// Get all questions
export function useQuestions() {
  return useQuery({
    queryKey: questionKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Question[] }>('/question');
      return response.data;
    },
  });
}

// Get question by ID
export function useQuestion(id: string | null) {
  return useQuery({
    queryKey: questionKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Question ID is required');
      const response = await apiClient.get<{ question: Question }>(`/question/${id}`);
      return response.question;
    },
    enabled: !!id,
  });
}

// Create question
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      text: string;
      categoryId: string;
      options: { text: string; points: number }[];
    }) => {
      const response = await apiClient.post<{ question: Question }>('/question', data);
      return response.question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    },
  });
}

// Update question
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        text: string;
        categoryId: string;
        options: { id?: string; text: string; points: number }[];
      }>;
    }) => {
      const response = await apiClient.patch<{ question: Question }>(`/question/${id}`, data);
      return response.question;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(variables.id) });
    },
  });
}

// Delete question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/question/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    },
  });
}

