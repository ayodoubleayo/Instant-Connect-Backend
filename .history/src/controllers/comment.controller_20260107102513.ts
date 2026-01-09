import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class CommentController {
  static async post(req: Request, res: Response) {
    // ✅ User already attached by authMiddleware
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { text } = req.body;

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        text,
      },
    });

    res.json(comment);
  }

  static async list(_: Request, res: Response) {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    res.json(comments);
  }
}
