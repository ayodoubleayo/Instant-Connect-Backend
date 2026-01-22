import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { UpdateProfileSchema } from "../validators/user.validator";
import { RelationshipIntent } from "@prisma/client";
import { suggestUsers } from "../services/discover.service";

/* =========================
   GET MY PROFILE
   ========================= */
export const getProfile = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  console.log("🟢 [UsersController:getProfile] START", { requestId });

  try {
    const me = (req as any).user;
    if (!me) {
      console.log("🔴 [getProfile] Unauthorized", { requestId });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: {
        id: true,
        username: true,
        email: true,
        gender: true,
        age: true,
        location: true,
        latitude: true,
        longitude: true,
        bio: true,
        profilePhoto: true,
        relationshipIntent: true,
        religion: true,
        preferredTribes: true,
        photos: { select: { id: true, url: true } },
        role: true,
        verifiedId: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log("🔴 [getProfile] Not found", { requestId });
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🟢 [getProfile] SUCCESS", { requestId });
    res.json({ ...user, photoCount: user.photos.length });
  } catch (err) {
    console.error("❌ [getProfile] ERROR", { requestId, err });
    res.status(500).json({ message: "Failed to load profile" });
  }
};

/* =========================
   UPDATE PROFILE
   ========================= */
export const updateProfile = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  console.log("🟢 [UsersController:updateProfile] START", { requestId });

  try {
    const me = (req as any).user;
    if (!me) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid profile data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: parsed.data,
    });

    console.log("🟢 [updateProfile] SUCCESS", { requestId });
    res.json(updated);
  } catch (err) {
    console.error("❌ [updateProfile] ERROR", { requestId, err });
    res.status(500).json({ message: "Profile update failed" });
  }
};

/* =========================
   DISCOVER USERS (INFINITE SCROLL READY)
   ========================= */
export const discoverUsers = async (
  req: Request<
    {},
    {},
    {},
    {
      intent?: RelationshipIntent;
      cursor?: string;
      limit?: string;
    }
  >,
  res: Response
) => {
  const requestId = (req as any).requestId;
  console.log("🟢 [UsersController:discoverUsers] START", { requestId });

  try {
    const tokenUser = (req as any).user;
    const { cursor, limit } = req.query;

    console.log("🔐 [discoverUsers] tokenUser", {
      requestId,
      tokenUser,
    });

    if (!tokenUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const me = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: {
        id: true,
        gender: true,
        latitude: true,
        longitude: true,
      },
    });

    console.log("👤 [discoverUsers] Me from DB", { requestId, me });

    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("➡️ [discoverUsers] Calling DiscoverService", {
      requestId,
      cursor,
      limit,
    });

    const result = await suggestUsers({
      me,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });

    console.log("🟢 [discoverUsers] END", {
      requestId,
      returned: result.users.length,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ [discoverUsers] ERROR", { requestId, err });
    res.status(500).json({ message: "Discover failed" });
  }
};

/* =========================
   PUBLIC PROFILE
   ========================= */
export const getPublicProfile = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  console.log("🟢 [UsersController:getPublicProfile] START", { requestId });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        age: true,
        gender: true,
        bio: true,
        profilePhoto: true,
        relationshipIntent: true,
        religion: true,
        preferredTribes: true,
        location: true,
        photos: { select: { id: true, url: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ ...user, photoCount: user.photos.length });
  } catch (err) {
    console.error("❌ [getPublicProfile] ERROR", { requestId, err });
    res.status(500).json({ message: "Failed to load user" });
  }
};


export const deletePhoto = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  console.log("🟢 [UsersController:deletePhoto] START", { requestId });

  try {
    const me = (req as any).user;
    const { photoId } = req.params;

    if (!me) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        userId: me.id,
      },
    });

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    await prisma.photo.delete({
      where: { id: photo.id },
    });

    console.log("🟢 [deletePhoto] SUCCESS", { requestId, photoId });
    return res.status(204).send();
  } catch (err) {
    console.error("❌ [deletePhoto] ERROR", { requestId, err });
    return res.status(500).json({ message: "Failed to delete photo" });
  }
};
