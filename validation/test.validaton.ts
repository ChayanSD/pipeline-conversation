import { z } from "zod";

export const submitTestSchema = z.object({
  presentationId: z.cuid({ message: "Invalid presentationId" }),
  userId: z.cuid({ message: "Invalid userId" }),
  answers: z
    .array(
      z.object({
        questionId: z.cuid({ message: "Invalid questionId" }),
        optionId: z.cuid({ message: "Invalid optionId" }),
      })
    )
    .min(1, { message: "At least one answer is required" }),
});

// TypeScript type for request
export type SubmitTestInput = z.infer<typeof submitTestSchema>;
