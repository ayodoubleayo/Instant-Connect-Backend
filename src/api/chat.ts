import express from "express";
import { sendMessage } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/:matchId", authMiddleware, sendMessage);

export default router;
