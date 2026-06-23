import { Router } from "express";
import * as controller from "../controllers/training.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createTrainingSchema,
  updateTrainingSchema,
  bulkDeleteSchema,
} from "../validators/training.schema";

const router = Router();

router.use(authenticate, authorize("school"));

/**
 * @openapi
 * /trainings:
 *   get: { tags: [Trainings], summary: List trainings }
 *   post: { tags: [Trainings], summary: Create training }
 */
router.get("/", controller.list);
router.post("/", validate(createTrainingSchema), controller.create);
router.post("/bulk-delete", validate(bulkDeleteSchema), controller.bulkRemove);
router.put("/:id", validate(updateTrainingSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
