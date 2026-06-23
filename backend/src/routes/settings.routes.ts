import { Router } from "express";
import * as controller from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/settings.schema";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /settings/profile:
 *   get: { tags: [Settings], summary: Get current account + school }
 *   put: { tags: [Settings], summary: Update account / school info }
 */
router.get("/profile", controller.getProfile);
router.put("/profile", validate(updateProfileSchema), controller.updateProfile);
router.put(
  "/password",
  validate(changePasswordSchema),
  controller.changePassword,
);

export default router;
