import { Router } from "express";
import * as controller from "../controllers/certification.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  generateSchema,
  publishSchema,
} from "../validators/certification.schema";

const router = Router();

router.use(authenticate, authorize("school"));

/**
 * @openapi
 * /certifications/students:
 *   get: { tags: [Certifications], summary: List students to certify }
 */
router.get("/students", controller.listCertifiable);
router.get("/preview/:studentId", controller.preview);
router.post("/generate", validate(generateSchema), controller.generate);
router.post("/publish", validate(publishSchema), controller.publish);

export default router;
