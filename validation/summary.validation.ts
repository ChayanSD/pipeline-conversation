import { z } from "zod";

export const NextStepSchema = z.object({
  type: z.enum(["text", "file"]),
  content: z.string(),
  fileUrl: z.string().optional(),
});

export const CategoryRecommendationSchema = z.object({
  categoryId: z.string(),
  recommendation: z.string(),
});

export const SummaryCreateSchema = z.object({
  presentationId: z.string().min(1, "Presentation ID is required"),
  categoryRecommendations: z.array(CategoryRecommendationSchema).optional(),
  nextSteps: z.array(NextStepSchema).optional(),
  overallDetails: z.string().optional(),
});

export const SummaryUpdateSchema = SummaryCreateSchema.partial().extend({
  presentationId: z.string().min(1, "Presentation ID is required"),
});

export type SummaryCreateData = z.infer<typeof SummaryCreateSchema>;
export type SummaryUpdateData = z.infer<typeof SummaryUpdateSchema>;
export type NextStep = z.infer<typeof NextStepSchema>;
export type CategoryRecommendation = z.infer<typeof CategoryRecommendationSchema>;

