import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  passCode: z.string().min(4, "Passcode must be at least 4 characters long"),
});

export type LoginData = z.infer<typeof LoginSchema>;