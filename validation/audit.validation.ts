import { z } from "zod";

export const AuditCreateSchema = z.object({
  title: z.string().min(1, "Presentation title is required"),

  categories: z
    .array(
      z.object({
        name: z.string().min(1, "Category name is required"),

        questions: z
          .array(
            z.object({
              text: z.string().min(1, "Question text is required"),

              options: z
                .array(
                  z.object({
                    text: z.string().min(1, "Option text is required"),
                    points: z.number().int().min(1).max(5).default(1),
                  })
                )
                .min(1, "Each question must have at least one option"),
            })
          )
          .min(1, "Each category must have at least one question"),
      })
    )
    .min(1, "Presentation must have at least one category"),
});


export type AuditCreateData = z.infer<typeof AuditCreateSchema>;

