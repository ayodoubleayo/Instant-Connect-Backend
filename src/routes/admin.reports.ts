// src/routes/report.routes.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.get("/reports", authMiddleware, adminMiddleware, async (_req, res) => {
  const reports = await prisma.report.findMany();
  res.json(reports);
});


export default router;
