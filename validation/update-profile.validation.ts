import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  companyName: z.string().min(1, 'Company name cannot be empty').optional(),
  passCode: z.string().min(6, 'PassCode must be at least 6 characters').optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  companyRole: z.string().optional(),
  profileImageUrl: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
  companyLogoUrl: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
});

export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;