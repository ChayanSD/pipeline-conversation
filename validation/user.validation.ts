import { z } from "zod";


export const UserRoleEnum = z.enum(["ADMIN", "USER"]);

export const UserCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: UserRoleEnum.default("USER"),
  avatarUrl: z.url().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = UserCreateSchema.partial() .extend({
    password: z.string().min(8).optional(),
  });;

// Type for User update input
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;

