import {z} from 'zod';

export const categorySchema = z.object({
     presentationId: z.cuid(),
     name: z.string().min(1, "Category name is required"),
})

export const updateCategorySchema = categorySchema.partial();