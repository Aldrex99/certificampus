import { Router } from "express";
import * as controller from "../controllers/billing.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { checkoutSchema } from "../validators/billing.schema";

const router = Router();

router.use(authenticate, authorize("school"));

/**
 * @openapi
 * /billing/plans:
 *   get: { tags: [Billing], summary: List available subscription plans }
 */
router.get("/plans", controller.listPlans);
router.get("/subscription", controller.getSubscription);
router.post("/checkout", validate(checkoutSchema), controller.checkout);

export default router;
