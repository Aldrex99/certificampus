import { Router } from "express";
import * as controller from "../controllers/speciality.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createSpecialitySchema,
  updateSpecialitySchema,
  bulkDeleteSchema,
} from "../validators/speciality.schema";

const router = Router();

router.use(authenticate, authorize("school"));

/**
 * @openapi
 * /specialities:
 *   get: { tags: [Specialities], summary: List specialities }
 *   post: { tags: [Specialities], summary: Create speciality }
 */
router.get("/", controller.list);
router.post("/", validate(createSpecialitySchema), controller.create);
router.post("/bulk-delete", validate(bulkDeleteSchema), controller.bulkRemove);
router.put("/:id", validate(updateSpecialitySchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
