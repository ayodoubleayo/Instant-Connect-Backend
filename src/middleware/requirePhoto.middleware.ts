import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const requirePhotoMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const me = (req as any).user;

    if (!me?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const photoCount = await prisma.photo.count({
      where: { userId: me.id },
    });

    if (photoCount < 1) {
      return res.status(403).json({
        message: "Upload at least one photo to continue",
        code: "PHOTO_REQUIRED",
      });
    }

    next();
  } catch (err) {
    console.error("❌ requirePhotoMiddleware error:", err);
    return res.status(500).json({ message: "Access check failed" });
  }
};
