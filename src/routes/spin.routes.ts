import { Router } from "express";
import { SpinController } from "../controllers/spin.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/status", authMiddleware, SpinController.status);
router.post("/", authMiddleware, SpinController.spin); // 🔐 Protect spin

export default router;
