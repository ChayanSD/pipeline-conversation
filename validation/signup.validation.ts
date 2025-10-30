import { z } from "zod";

const RoleEnum = z.enum(["ADMIN", "USER"]);

export const SignupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address").optional(),
    passCode: z.string().min(4, "Passcode must be at least 4 characters long"),
    companyName: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    profileImageUrl: z.url("Invalid URL").optional(),
    companyRole: z.string().optional(),
    companyId: z.string().optional(),
    companyLogoUrl: z.url("Invalid URL").optional(),
    role: RoleEnum.default("USER"),
    inviteToken: z.string().optional(),
  });

export type SignupData = z.infer<typeof SignupSchema>;
