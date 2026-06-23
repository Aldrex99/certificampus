import { z } from "zod";

export const generateSchema = z.object({
  body: z.object({
    studentIds: z
      .array(z.string().min(1))
      .min(1, "Sélectionnez au moins un étudiant"),
    templateId: z.string().optional(),
  }),
});

export const publishSchema = z.object({
  body: z.object({
    diplomaIds: z
      .array(z.string().min(1))
      .min(1, "Sélectionnez au moins un diplôme"),
    send: z.boolean().optional(),
  }),
});

export type GenerateInput = z.infer<typeof generateSchema>["body"];
export type PublishInput = z.infer<typeof publishSchema>["body"];
