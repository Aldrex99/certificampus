import { Router } from "express";
import * as controller from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [School]
 *     summary: School dashboard statistics
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", authenticate, authorize("school"), controller.getDashboard);

export default router;
