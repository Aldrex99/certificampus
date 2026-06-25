import { Router } from "express";
import * as controller from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createSchoolSchema,
  updateSchoolSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  createPlanSchema,
  updatePlanSchema,
  createTemplateSchema,
  updateTemplateSchema,
  bulkDeleteSchema,
} from "../validators/admin.schema";

const router = Router();

// Every admin route requires an authenticated admin.
router.use(authenticate, authorize("admin"));

/**
 * @openapi
 * /admin/dashboard:
 *   get: { tags: [Admin], summary: Global statistics }
 */
router.get("/dashboard", controller.dashboard);

/* Schools */
router.get("/schools", controller.listSchools);
router.post("/schools", validate(createSchoolSchema), controller.createSchool);
router.post(
  "/schools/bulk-delete",
  validate(bulkDeleteSchema),
  controller.bulkDeleteSchools,
);
router.put(
  "/schools/:id",
  validate(updateSchoolSchema),
  controller.updateSchool,
);
router.delete("/schools/:id", controller.deleteSchool);

/* Subscriptions */
router.get("/subscriptions", controller.listSubscriptions);
router.post(
  "/subscriptions",
  validate(createSubscriptionSchema),
  controller.createSubscription,
);
router.post(
  "/subscriptions/bulk-delete",
  validate(bulkDeleteSchema),
  controller.bulkDeleteSubscriptions,
);
router.put(
  "/subscriptions/:id",
  validate(updateSubscriptionSchema),
  controller.updateSubscription,
);
router.delete("/subscriptions/:id", controller.deleteSubscription);

/* Plans (subscription catalog) */
router.get("/plans", controller.listPlans);
router.post("/plans", validate(createPlanSchema), controller.createPlan);
router.post(
  "/plans/bulk-delete",
  validate(bulkDeleteSchema),
  controller.bulkDeletePlans,
);
router.put("/plans/:id", validate(updatePlanSchema), controller.updatePlan);
router.delete("/plans/:id", controller.deletePlan);

/* Diploma templates */
router.get("/templates", controller.listTemplates);
router.post(
  "/templates",
  validate(createTemplateSchema),
  controller.createTemplate,
);
router.put(
  "/templates/:id",
  validate(updateTemplateSchema),
  controller.updateTemplate,
);
router.delete("/templates/:id", controller.deleteTemplate);

export default router;
