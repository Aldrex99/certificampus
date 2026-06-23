import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import settingsRoutes from "./settings.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, status: "ok" }));

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/settings", settingsRoutes);

export default router;
