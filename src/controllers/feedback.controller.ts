import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/* =========================
   CREATE FEEDBACK
========================= */
export const createFeedback = async (req: Request, res: Response) => {
  const me = (req as any).user;
  const { type, message } = req.body;

  if (!me) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!type || !message) {
    return res.status(400).json({ message: "Type and message required" });
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: me.id,
      type,
      message,
    },
  });

  res.json(feedback);
};

/* =========================
   ADMIN: GET ALL FEEDBACK
========================= */
export const getAllFeedback = async (_req: Request, res: Response) => {
  const feedback = await prisma.feedback.findMany({
    include: {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(feedback);
};

/* =========================
   ADMIN: MARK RESOLVED
========================= */
export const resolveFeedback = async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.feedback.update({
    where: { id },
    data: { resolved: true },
  });

  res.json({ success: true });
};
