import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import settingsRoutes from "./settings.routes";
import trainingRoutes from "./training.routes";
import studentRoutes from "./student.routes";
import certificationRoutes from "./certification.routes";
import verifyRoutes from "./verify.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, status: "ok" }));

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/settings", settingsRoutes);
router.use("/trainings", trainingRoutes);
router.use("/students", studentRoutes);
router.use("/certifications", certificationRoutes);
router.use("/verify", verifyRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
