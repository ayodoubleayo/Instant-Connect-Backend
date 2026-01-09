import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/* =======================
   GET MATCH BY ID
======================= */
/* =======================
   GET MATCH BY ID (UX READY)
======================= */
export const getMatchById = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const matchId = req.params.id;
  const meId = req.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: {
        select: {
          id: true,
          realName: true,
          username: true,
          profilePhoto: true,
        },
      },
      userB: {
        select: {
          id: true,
          realName: true,
          username: true,
          profilePhoto: true,
        },
      },
    },
  });

  if (!match) {
    return res.status(404).json({ message: "Match not found" });
  }

  if (match.userAId !== meId && match.userBId !== meId) {
    return res.status(403).json({ message: "Access denied" });
  }

  /* ================= DERIVE ROLES ================= */
  const me =
    match.userAId === meId ? match.userA : match.userB;

  const partner =
    match.userAId === meId ? match.userB : match.userA;

  /* ================= RESPONSE ================= */
  return res.json({
    id: match.id,
    unlocked: match.unlocked,
    price: match.price,

    me: {
      id: me.id,
    },

    partner: {
      id: partner.id,
      realName: partner.realName,
      username: partner.username,
      profilePhoto: partner.profilePhoto,
    },
  });
};

/* =======================
   GET MATCH CONTACT
======================= */
export const getMatchContact = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const matchId = req.params.id;
  const userId = req.user.id;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { select: { phone: true, id: true } },
      userB: { select: { phone: true, id: true } },
    },
  });

  if (!match) {
    return res.status(404).json({ message: "Match not found" });
  }

  if (match.userAId !== userId && match.userBId !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!match.unlocked) {
    return res.status(403).json({ message: "Payment not completed" });
  }

  return res.json({
    userA: match.userA.phone,
    userB: match.userB.phone,
  });
};

/* =======================
   START MATCH
======================= */
export const startMatch = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const meId = req.user.id;
  const otherUserId = req.params.userId;

  if (meId === otherUserId) {
    return res.status(400).json({ message: "Cannot match yourself" });
  }

  const existingMatch = await prisma.match.findFirst({
    where: {
      OR: [
        { userAId: meId, userBId: otherUserId },
        { userAId: otherUserId, userBId: meId },
      ],
    },
  });

  if (existingMatch) {
    return res.json({ matchId: existingMatch.id });
  }

  const match = await prisma.match.create({
    data: {
      userAId: meId,
      userBId: otherUserId,
      unlocked: false,
    },
  });

  return res.json({ matchId: match.id });
};

/* =======================
   START CHAT (UPDATED)
======================= */
export const startChat = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const requesterAuth = req.user;
  const otherUserId = req.params.userId;

  if (requesterAuth.id === otherUserId) {
    return res.status(400).json({ message: "Cannot chat with yourself" });
  }

  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { userAId: requesterAuth.id, userBId: otherUserId },
        { userAId: otherUserId, userBId: requesterAuth.id },
      ],
    },
  });

  if (existing) {
    return res.json({ matchId: existing.id });
  }

  const requester = await prisma.user.findUnique({
    where: { id: requesterAuth.id },
    select: { id: true, gender: true },
  });

  if (!requester) {
    return res.status(404).json({ message: "User not found" });
  }

  const target = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }

  // 🔐 POLICY-BASED PRICING
  const price = requester.gender === "MALE" ? 2500 : 1500;

  const match = await prisma.match.create({
    data: {
      userAId: requester.id,
      userBId: target.id,
      price,
      unlocked: false,
    },
  });

  return res.json({ matchId: match.id });
};
