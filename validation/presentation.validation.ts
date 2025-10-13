import {z} from 'zod';

export const presentationSchema = z.object({
     userId: z.cuid(),
     title: z.string().min(1, "Title is required"),
})


export type PresentationType = z.infer<typeof presentationSchema>
export const updatePresentationSchema = presentationSchema.partial();