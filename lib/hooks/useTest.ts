import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher';
import { Question, CategoryScore } from '../types';

// Query keys
export const testKeys = {
  all: ['tests'] as const,
  questions: (presentationId: string) => [...testKeys.all, 'questions', presentationId] as const,
  results: () => [...testKeys.all, 'results'] as const,
  result: (testId: string) => [...testKeys.results(), testId] as const,
};

// Get questions for presentation
export function useTestQuestions(presentationId: string | null) {
  return useQuery({
    queryKey: testKeys.questions(presentationId || ''),
    queryFn: async () => {
      if (!presentationId) throw new Error('Presentation ID is required');
      const response = await apiClient.get<{ questions: Question[] }>(
        `/test/questions/${presentationId}`
      );
      return response.questions;
    },
    enabled: !!presentationId,
  });
}

// Submit test
export function useSubmitTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      presentationId: string;
      answers: { questionId: string; optionId: string }[];
    }) => {
      const response = await apiClient.post<{
        data: { testId: string; totalScore: number; categoryScores: CategoryScore[] };
      }>('/test/submit', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testKeys.questions(variables.presentationId) });
    },
  });
}

