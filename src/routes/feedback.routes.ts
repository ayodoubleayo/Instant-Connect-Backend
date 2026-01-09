import { Router } from "express";
import {
  createFeedback,
  getAllFeedback,
  resolveFeedback,
} from "../controllers/feedback.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// User
router.post("/", authMiddleware, createFeedback);

// Admin
router.get("/", authMiddleware, adminMiddleware, getAllFeedback);
router.patch("/:id/resolve", authMiddleware, adminMiddleware, resolveFeedback);

export default router;
