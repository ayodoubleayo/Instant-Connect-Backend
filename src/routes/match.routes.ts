import { Router } from "express";
import { getMatchById, getMatchContact ,startChat } from "../controllers/match.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/:id", authMiddleware, getMatchById);
router.get("/:id/contact", authMiddleware, getMatchContact); // ✅ NEW
router.post("/start/:userId", authMiddleware, startChat);

export default router;
