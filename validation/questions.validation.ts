// lib/validation/question.ts
import { z } from 'zod';

export const createOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  points: z.number().int().min(0, 'Points must be a non-negative integer'),
});

export const createQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  options: z
    .array(createOptionSchema)
    .min(1, 'At least one option is required'),
});
export const updateQuestionSchema = z.object({
  text: z.string().optional(),
  categoryId: z.string().optional(),
  options: z
    .array(
      z.object({
        id: z.string().optional(), // optional because new options may not have one
        text: z.string(),
        points: z.number(),
      })
    )
    .optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

