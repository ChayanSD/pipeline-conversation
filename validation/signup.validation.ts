import { z } from "zod";

const RoleEnum = z.enum(["ADMIN", "USER"]);

export const SignupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
    passCode: z.string().min(4, "Passcode must be at least 4 characters long"),
    companyName: z.union([z.string(), z.literal("")]).optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    profileImageUrl: z.string().optional(),
    companyRole: z.string().optional(),
    companyId: z.string().optional(),
    companyLogoUrl: z.string().optional(),
    role: RoleEnum.default("USER"),
    inviteToken: z.union([z.string().min(1), z.literal("")]).optional(),
  })
  .refine(
    (data) => {
      // If inviteToken is present and not empty, skip email validation
      const hasValidToken = data.inviteToken && typeof data.inviteToken === 'string' && data.inviteToken.trim().length > 0;
      if (hasValidToken) {
        return true;
      }
      // If no inviteToken, email is required and must be valid
      return data.email && typeof data.email === 'string' && data.email.trim().length > 0 && z.string().email().safeParse(data.email).success;
    },
    {
      message: "Email is required for normal registration",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      // If inviteToken is present and not empty, skip companyName validation
      const hasValidToken = data.inviteToken && typeof data.inviteToken === 'string' && data.inviteToken.trim().length > 0;
      if (hasValidToken) {
        return true;
      }
      // If no inviteToken, companyName is required (must be non-empty string)
      return data.companyName && typeof data.companyName === 'string' && data.companyName.trim().length > 0;
    },
    {
      message: "Company name is required for normal registration",
      path: ["companyName"],
    }
  );

export type SignupData = z.infer<typeof SignupSchema>;
