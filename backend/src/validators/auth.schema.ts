import { z } from 'zod';

const email = z.string().email('Adresse e-mail invalide').toLowerCase();
const password = z.string().min(1, 'Mot de passe requis');

export const registerSchema = z.object({
  body: z.object({
    firstname: z.string().min(1, 'Prénom requis'),
    lastname: z.string().min(1, 'Nom requis'),
    email,
    password,
    schoolName: z.string().min(1, "Nom de l'établissement requis"),
    address: z.string().optional(),
    region: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password,
  }),
});

export const activateSchema = z.object({
  body: z.object({
    email,
    token: z.string().min(1, 'Token requis'),
    password: z.string().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email,
    token: z.string().min(1, 'Token requis'),
    password,
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ActivateInput = z.infer<typeof activateSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
