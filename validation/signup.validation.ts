import { z } from "zod";

const RoleEnum = z.enum(["ADMIN", "USER"]);

export const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  passCode: z.string().min(4, "Passcode must be at least 4 characters long"),
  companyName: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  profileImageUrl: z.url("Invalid URL").optional(),
  companyLogoUrl: z.url("Invalid URL").optional(),
  role: RoleEnum.default("USER"),
});

export type SignupData = z.infer<typeof SignupSchema>;