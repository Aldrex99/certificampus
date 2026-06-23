import { Router } from "express";
import * as controller from "../controllers/student.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { uploadExcel } from "../middleware/upload";
import {
  createStudentSchema,
  updateStudentSchema,
  bulkDeleteSchema,
} from "../validators/student.schema";

const router = Router();

// All student routes are restricted to authenticated school users.
router.use(authenticate, authorize("school"));

/**
 * @openapi
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: List the school's students (paginated, filterable)
 *   post:
 *     tags: [Students]
 *     summary: Create a student
 */
router.get("/", controller.list);
router.post("/", validate(createStudentSchema), controller.create);

router.get("/template", controller.downloadTemplate);
router.post("/import", uploadExcel, controller.importExcel);
router.post("/bulk-delete", validate(bulkDeleteSchema), controller.bulkRemove);

router.get("/:id", controller.getOne);
router.put("/:id", validate(updateStudentSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
