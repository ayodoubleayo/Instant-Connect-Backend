import { Router } from "express";
import prisma from "../lib/db";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, async (req: any, res) => {
  const report = await prisma.report.create({
    data: {
      reporterId: req.user.id,
      targetId: req.body.targetId,
      reason: req.body.reason
    }
  });

  res.status(201).json(report);
});

export default router;
