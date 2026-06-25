import { Request, Response } from "express";
import * as service from "../services/billing.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/http";
import { AuthRequest } from "../types";
import { requireSchoolId } from "../utils/context";

export const listPlans = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    ok(res, await service.listPlans());
  },
);

export const getSubscription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    ok(res, await service.getCurrentSubscription(schoolId));
  },
);

export const checkout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    const result = await service.createCheckoutSession(
      schoolId,
      req.body.planId,
    );
    ok(res, result);
  },
);

/**
 * Stripe webhook. Mounted with a raw body parser so the signature can be
 * verified. Always responds 200 quickly; errors are logged, not surfaced.
 */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string | undefined;
  try {
    await service.handleWebhook(req.body as Buffer, signature);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[stripe] webhook error", err);
    res.status(400).json({ received: false });
    return;
  }
  res.json({ received: true });
});
