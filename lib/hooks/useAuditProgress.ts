import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/fetcher";

export type AuditProgressResponse = {
  answers: Record<string, string>;
  updatedAt: string | null;
  updatedBy: string | null;
};

export const auditProgressKeys = {
  detail: (presentationId: string) =>
    ["audit-progress", presentationId] as const,
};

export function useAuditProgress(presentationId: string | null) {
  return useQuery({
    queryKey: auditProgressKeys.detail(presentationId || "unknown"),
    queryFn: async () => {
      if (!presentationId) {
        throw new Error("Presentation ID is required");
      }
      return apiClient.get<AuditProgressResponse>(
        `/test/progress/${presentationId}`
      );
    },
    enabled: !!presentationId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
}

