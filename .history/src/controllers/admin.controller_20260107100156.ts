import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getIO } from "../socket";

/* ======================================================
   ADMIN STATS (DASHBOARD)
   ====================================================== */
export const getAdminStats = async (_req: Request, res: Response) => {
  const [users, payments, pendingPayments] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count(),
    prisma.payment.count({
      where: { status: "PENDING" },
    }),
  ]);

  res.json({
    users,
    payments,
    pendingPayments,
  });
};

/* ======================================================
   ADMIN PAYMENTS (REVIEW)
   ====================================================== */
export const getAdminPayments = async (_req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      payer: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      beneficiary: {
        select: {
          id: true,
          username: true,
        },
      },
      match: true,
    },
  });

  res.json(payments);
};

/* ======================================================
   APPROVE PAYMENT (HIGH-RISK ACTION)
   ====================================================== */
export const approvePayment = async (req: Request, res: Response) => {
  const paymentId = req.params.id;

  /* ================= FETCH PAYMENT ================= */
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  if (!payment.proofUrl) {
    return res.status(400).json({
      message: "Cannot approve payment without proof",
    });
  }

  if (payment.status === "APPROVED") {
    return res.status(400).json({
      message: "Payment already approved",
    });
  }

  /* ================= APPROVE PAYMENT ================= */
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "APPROVED" },
  });

  /* ================= PERMANENT UNLOCK ================= */
  await prisma.match.update({
    where: { id: payment.matchId },
    data: { unlocked: true },
  });

  /* ================= REALTIME NOTIFY ================= */
  const io = getIO();

  io.to(`match:${payment.matchId}`).emit("match:unlocked", {
    matchId: payment.matchId,
  });

  res.json({
    success: "Payment approved & match permanently unlocked",
  });
};

/* ======================================================
   ADMIN USERS (PAGINATED — SAFE FOR 10K+ USERS)
   ====================================================== */
export const getAdminUsers = async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true,
        _count: {
          select: {
            blocksInitiated: true,
            blocksReceived: true,
          },
        },
      },
    }),
    prisma.user.count(),
  ]);

  res.json({
    users,
    total,
    page,
    limit,
  });
};


/* ======================================================
   SUSPEND / UNSUSPEND USER (SOFT RESTRICTION)
   ====================================================== */
export const toggleSuspendUser = async (req: Request, res: Response) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

const isBlocked = await prisma.userBlock.findFirst({
  where: {
    blockedId: userId,
  },
});

if (isBlocked) {
  return res.status(400).json({
    message: "Blocked users cannot be suspended",
  });
}

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { suspended: !user.suspended },
  });

  res.json({
    success: true,
    user: updated,
  });
};

/* ======================================================
   BLOCK / UNBLOCK USER (HARD RESTRICTION)
   ====================================================== */
export const toggleBlockUser = async (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const adminUser = (req as any).user; // set by authMiddleware

  /* ================= BASIC GUARDS ================= */

  // 1️⃣ Prevent self-block
  if (adminUser.id === targetUserId) {
    return res.status(400).json({
      message: "Admins cannot block themselves",
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // 2️⃣ Prevent admin → admin block
  if (targetUser.role === "ADMIN") {
    return res.status(403).json({
      message: "Admins cannot block other admins",
    });
  }

  /* ================= CHECK EXISTING BLOCK ================= */

  const existingBlock = await prisma.userBlock.findFirst({
    where: {
      blockerId: adminUser.id,
      blockedId: targetUserId,
    },
  });

  /* ================= UNBLOCK ================= */
  if (existingBlock) {
    await prisma.userBlock.delete({
      where: { id: existingBlock.id },
    });

    return res.json({
      success: true,
      blocked: false,
    });
  }

  /* ================= BLOCK ================= */
  await prisma.userBlock.create({
    data: {
      blockerId: adminUser.id, // ✅ real admin id
      blockedId: targetUserId,
    },
  });

  // Hard governance rule: blocked ⇒ suspended
  await prisma.user.update({
    where: { id: targetUserId },
    data: { suspended: true },
  });

  res.json({
    success: true,
    blocked: true,
  });
};
/* ======================================================
   MARK PAYOUT AS PAID (HIGH-RISK ADMIN ACTION)
   ====================================================== */
export const markPayoutAsPaid = async (req: Request, res: Response) => {
  const payoutId = req.params.id;
  const adminUser = (req as any).user; // set by authMiddleware

  /* ================= BASIC GUARDS ================= */

  if (!adminUser || adminUser.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin only" });
  }

  /* ================= FETCH PAYOUT ================= */

  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return res.status(404).json({ message: "Payout not found" });
  }

  if (payout.status === "PAID") {
    return res.status(400).json({
      message: "Payout already marked as paid",
    });
  }

  /* ================= MARK AS PAID ================= */

  await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paidByAdminId: adminUser.id,
    },
  });

  res.json({
    success: true,
    message: "Payout successfully marked as paid",
  });
};
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/* ======================================================
   ADMIN WINNERS (READ-ONLY)
   ====================================================== */
export const getAdminWinners = async (_req: Request, res: Response) => {
  const winners = await prisma.spinResult.findMany({
    where: { isWinner: true },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  res.json(winners);
};
