import { Router } from "express";
import * as controller from "../controllers/verify.controller";

const router = Router();

/**
 * @openapi
 * /verify/{token}:
 *   get:
 *     tags: [Public]
 *     summary: Verify a diploma authenticity by its QR token
 *     security: []
 */
router.get("/:token", controller.verify);

export default router;
