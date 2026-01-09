import { Router } from "express";
import {
  sendMessage,
  getInbox,
  markSeen,
  deleteMessage,
} from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.get("/inbox", authMiddleware, getInbox);

router.post(
  "/:matchId",
  authMiddleware,
  upload.single("image"),
  sendMessage
);

router.post("/:matchId/seen", authMiddleware, markSeen);

router.delete("/message/:messageId", authMiddleware, deleteMessage);

router.get("/:matchId", authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const userId = (req as any).user.id;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });

  if (!match) return res.status(403).json({ message: "Not allowed" });

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages);
});

export default router;
