import { z } from "zod";

export const checkoutSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "Formule requise"),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>["body"];
