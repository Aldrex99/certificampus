import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  activateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.schema";

const router = Router();

// Throttle sensitive auth endpoints against brute-force / abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new school account
 *     responses:
 *       201: { description: Created }
 *       400: { description: Invalid data }
 *       409: { description: Email already used }
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  controller.register,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate and receive a JWT
 */
router.post("/login", authLimiter, validate(loginSchema), controller.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the access/refresh tokens using the refresh cookie
 *     security: []
 */
router.post("/refresh", controller.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current session and clear auth cookies
 *     security: []
 */
router.post("/logout", controller.logout);

/**
 * @openapi
 * /auth/activate:
 *   post:
 *     tags: [Auth]
 *     summary: Activate an account on first connection
 */
router.post("/activate", validate(activateSchema), controller.activate);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 */
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using an emailed token
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  controller.resetPassword,
);

export default router;
