import { z } from "zod";

const RoleEnum = z.enum(["ADMIN", "USER"]);

export const SignupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address").optional(),
    passCode: z.string().min(4, "Passcode must be at least 4 characters long"),
    companyName: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    profileImageUrl: z.string().url("Invalid URL").optional(),
    companyRole: z.string().optional(),
    companyId: z.string().optional(),
    companyLogoUrl: z.string().url("Invalid URL").optional(),
    role: RoleEnum.default("USER"),
    inviteToken: z.string().optional(),
  })
  .refine(
    (data) => {
      // If inviteToken is present, email is not required (it's from invite)
      if (data.inviteToken) {
        return true;
      }
      // If no inviteToken, email is required
      return data.email && data.email.length > 0;
    },
    {
      message: "Email is required for normal registration",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      // If inviteToken is present, companyName is not required
      if (data.inviteToken) {
        return true;
      }
      // If no inviteToken, companyName is required
      return data.companyName && data.companyName.length > 0;
    },
    {
      message: "Company name is required for normal registration",
      path: ["companyName"],
    }
  );

export type SignupData = z.infer<typeof SignupSchema>;
