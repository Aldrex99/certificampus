import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, status: "ok" }));

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

export default router;
