import { z } from "zod";

export const createSchoolSchema = z.object({
  body: z.object({
    label: z.string().min(1, "Nom de l'établissement requis"),
    address: z.string().optional(),
    region: z.string().optional(),
    ownerFirstname: z.string().min(1, "Prénom du responsable requis"),
    ownerLastname: z.string().min(1, "Nom du responsable requis"),
    ownerEmail: z.string().email("E-mail du responsable invalide"),
  }),
});

export const updateSchoolSchema = z.object({
  body: z.object({
    label: z.string().min(1).optional(),
    address: z.string().optional(),
    region: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(["monthly", "yearly", "one-time"]).optional(),
    price: z.number().min(0),
    status: z.enum(["active", "pending", "cancelled", "expired"]).optional(),
    school: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const updateSubscriptionSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(["monthly", "yearly", "one-time"]).optional(),
    price: z.number().min(0).optional(),
    status: z.enum(["active", "pending", "cancelled", "expired"]).optional(),
    school: z.string().nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nom de la formule requis"),
    description: z.string().optional(),
    price: z.number().min(0),
    interval: z.enum(["month", "year"]).optional(),
    certificateQuota: z.number().int().min(1),
    stripePriceId: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    interval: z.enum(["month", "year"]).optional(),
    certificateQuota: z.number().int().min(1).optional(),
    stripePriceId: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    content: z.string().min(1),
    isDefault: z.boolean().optional(),
  }),
});

export const updateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({ ids: z.array(z.string().min(1)).min(1) }),
});
