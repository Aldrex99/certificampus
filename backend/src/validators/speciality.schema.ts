import { z } from "zod";

export const createSpecialitySchema = z.object({
  body: z.object({
    label: z.string().min(1, "Libellé requis"),
    description: z.string().optional(),
  }),
});

export const updateSpecialitySchema = z.object({
  body: z.object({
    label: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1),
  }),
});

export type CreateSpecialityInput = z.infer<
  typeof createSpecialitySchema
>["body"];
export type UpdateSpecialityInput = z.infer<
  typeof updateSpecialitySchema
>["body"];
