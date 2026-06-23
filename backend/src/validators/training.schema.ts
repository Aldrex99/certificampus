import { z } from "zod";

export const createTrainingSchema = z.object({
  body: z.object({
    label: z.string().min(1, "Libellé requis"),
    description: z.string().optional(),
    level: z.string().optional(),
    specialities: z.array(z.string()).optional(),
  }),
});

export const updateTrainingSchema = z.object({
  body: z.object({
    label: z.string().min(1).optional(),
    description: z.string().optional(),
    level: z.string().optional(),
    specialities: z.array(z.string()).optional(),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1),
  }),
});

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>["body"];
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>["body"];
