import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    firstname: z.string().min(1).optional(),
    lastname: z.string().min(1).optional(),
    email: z.string().email().optional(),
    schoolName: z.string().min(1).optional(),
    address: z.string().optional(),
    region: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(1, "Nouveau mot de passe requis"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
