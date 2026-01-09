"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markPayoutAsPaid = exports.toggleBlockUser = exports.toggleSuspendUser = exports.getAdminUsers = exports.approvePayment = exports.getAdminPayments = exports.getAdminStats = void 0;
const prisma_1 = require("../lib/prisma");
const socket_1 = require("../socket");
/* ======================================================
   ADMIN STATS (DASHBOARD)
   ====================================================== */
const getAdminStats = async (_req, res) => {
    const [users, payments, pendingPayments] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.payment.count(),
        prisma_1.prisma.payment.count({
            where: { status: "PENDING" },
        }),
    ]);
    res.json({
        users,
        payments,
        pendingPayments,
    });
};
exports.getAdminStats = getAdminStats;
/* ======================================================
   ADMIN PAYMENTS (REVIEW)
   ====================================================== */
const getAdminPayments = async (_req, res) => {
    const payments = await prisma_1.prisma.payment.findMany({
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
exports.getAdminPayments = getAdminPayments;
/* ======================================================
   APPROVE PAYMENT (HIGH-RISK ACTION)
   ====================================================== */
const approvePayment = async (req, res) => {
    const paymentId = req.params.id;
    /* ================= FETCH PAYMENT ================= */
    const payment = await prisma_1.prisma.payment.findUnique({
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
    await prisma_1.prisma.payment.update({
        where: { id: paymentId },
        data: { status: "APPROVED" },
    });
    /* ================= PERMANENT UNLOCK ================= */
    await prisma_1.prisma.match.update({
        where: { id: payment.matchId },
        data: { unlocked: true },
    });
    /* ================= REALTIME NOTIFY ================= */
    const io = (0, socket_1.getIO)();
    io.to(`match:${payment.matchId}`).emit("match:unlocked", {
        matchId: payment.matchId,
    });
    res.json({
        success: "Payment approved & match permanently unlocked",
    });
};
exports.approvePayment = approvePayment;
/* ======================================================
   ADMIN USERS (PAGINATED — SAFE FOR 10K+ USERS)
   ====================================================== */
const getAdminUsers = async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
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
        prisma_1.prisma.user.count(),
    ]);
    res.json({
        users,
        total,
        page,
        limit,
    });
};
exports.getAdminUsers = getAdminUsers;
/* ======================================================
   SUSPEND / UNSUSPEND USER (SOFT RESTRICTION)
   ====================================================== */
const toggleSuspendUser = async (req, res) => {
    const userId = req.params.id;
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const isBlocked = await prisma_1.prisma.userBlock.findFirst({
        where: {
            blockedId: userId,
        },
    });
    if (isBlocked) {
        return res.status(400).json({
            message: "Blocked users cannot be suspended",
        });
    }
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { suspended: !user.suspended },
    });
    res.json({
        success: true,
        user: updated,
    });
};
exports.toggleSuspendUser = toggleSuspendUser;
/* ======================================================
   BLOCK / UNBLOCK USER (HARD RESTRICTION)
   ====================================================== */
const toggleBlockUser = async (req, res) => {
    const targetUserId = req.params.id;
    const adminUser = req.user; // set by authMiddleware
    /* ================= BASIC GUARDS ================= */
    // 1️⃣ Prevent self-block
    if (adminUser.id === targetUserId) {
        return res.status(400).json({
            message: "Admins cannot block themselves",
        });
    }
    const targetUser = await prisma_1.prisma.user.findUnique({
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
    const existingBlock = await prisma_1.prisma.userBlock.findFirst({
        where: {
            blockerId: adminUser.id,
            blockedId: targetUserId,
        },
    });
    /* ================= UNBLOCK ================= */
    if (existingBlock) {
        await prisma_1.prisma.userBlock.delete({
            where: { id: existingBlock.id },
        });
        return res.json({
            success: true,
            blocked: false,
        });
    }
    /* ================= BLOCK ================= */
    await prisma_1.prisma.userBlock.create({
        data: {
            blockerId: adminUser.id, // ✅ real admin id
            blockedId: targetUserId,
        },
    });
    // Hard governance rule: blocked ⇒ suspended
    await prisma_1.prisma.user.update({
        where: { id: targetUserId },
        data: { suspended: true },
    });
    res.json({
        success: true,
        blocked: true,
    });
};
exports.toggleBlockUser = toggleBlockUser;
/* ======================================================
   MARK PAYOUT AS PAID (HIGH-RISK ADMIN ACTION)
   ====================================================== */
const markPayoutAsPaid = async (req, res) => {
    const payoutId = req.params.id;
    const adminUser = req.user; // set by authMiddleware
    /* ================= BASIC GUARDS ================= */
    if (!adminUser || adminUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
    }
    /* ================= FETCH PAYOUT ================= */
    const payout = await prisma_1.prisma.payoutRequest.findUnique({
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
    await prisma_1.prisma.payoutRequest.update({
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
exports.markPayoutAsPaid = markPayoutAsPaid;
/* ======================================================
   ADMIN WINNERS (READ-ONLY)
   ====================================================== */
