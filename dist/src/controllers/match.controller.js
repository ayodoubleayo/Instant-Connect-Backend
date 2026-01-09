"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startChat = exports.startMatch = exports.getMatchContact = exports.getMatchById = void 0;
const prisma_1 = require("../lib/prisma");
/* =======================
   GET MATCH BY ID
======================= */
/* =======================
   GET MATCH BY ID (UX READY)
======================= */
const getMatchById = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const matchId = req.params.id;
    const meId = req.user.id;
    const match = await prisma_1.prisma.match.findUnique({
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
    const me = match.userAId === meId ? match.userA : match.userB;
    const partner = match.userAId === meId ? match.userB : match.userA;
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
exports.getMatchById = getMatchById;
/* =======================
   GET MATCH CONTACT
======================= */
const getMatchContact = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const matchId = req.params.id;
    const userId = req.user.id;
    const match = await prisma_1.prisma.match.findUnique({
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
exports.getMatchContact = getMatchContact;
/* =======================
   START MATCH
======================= */
const startMatch = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const meId = req.user.id;
    const otherUserId = req.params.userId;
    if (meId === otherUserId) {
        return res.status(400).json({ message: "Cannot match yourself" });
    }
    const existingMatch = await prisma_1.prisma.match.findFirst({
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
    const match = await prisma_1.prisma.match.create({
        data: {
            userAId: meId,
            userBId: otherUserId,
            unlocked: false,
        },
    });
    return res.json({ matchId: match.id });
};
exports.startMatch = startMatch;
/* =======================
   START CHAT (UPDATED)
======================= */
const startChat = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const requesterAuth = req.user;
    const otherUserId = req.params.userId;
    if (requesterAuth.id === otherUserId) {
        return res.status(400).json({ message: "Cannot chat with yourself" });
    }
    const existing = await prisma_1.prisma.match.findFirst({
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
    const requester = await prisma_1.prisma.user.findUnique({
        where: { id: requesterAuth.id },
        select: { id: true, gender: true },
    });
    if (!requester) {
        return res.status(404).json({ message: "User not found" });
    }
    const target = await prisma_1.prisma.user.findUnique({
        where: { id: otherUserId },
        select: { id: true },
    });
    if (!target) {
        return res.status(404).json({ message: "User not found" });
    }
    // 🔐 POLICY-BASED PRICING
    const price = requester.gender === "MALE" ? 2500 : 1500;
    const match = await prisma_1.prisma.match.create({
        data: {
            userAId: requester.id,
            userBId: target.id,
            price,
            unlocked: false,
        },
    });
    return res.json({ matchId: match.id });
};
exports.startChat = startChat;
