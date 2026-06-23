import { z } from "zod";

const status = z.enum(["admis", "ajourne"]);

export const createStudentSchema = z.object({
  body: z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.string().email(),
    training: z.string().optional(),
    speciality: z.string().optional(),
    status: status.optional(),
    grade: z.string().optional(),
    graduationDate: z.coerce.date().optional(),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    firstname: z.string().min(1).optional(),
    lastname: z.string().min(1).optional(),
    email: z.string().email().optional(),
    training: z.string().nullable().optional(),
    speciality: z.string().nullable().optional(),
    status: status.optional(),
    grade: z.string().optional(),
    graduationDate: z.coerce.date().optional(),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().min(1))
      .min(1, "Au moins un identifiant est requis"),
  }),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>["body"];
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>["body"];
