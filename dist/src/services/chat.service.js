"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const prisma_1 = require("../lib/prisma");
const chatFilter_1 = require("../utils/chatFilter");
class ChatService {
    /* =====================================================
       SEND MESSAGE
    ===================================================== */
    static async send(senderId, matchId, content, imageUrl, clientId) {
        console.log("📤 [ChatService.send] start", {
            senderId,
            matchId,
            hasContent: !!content,
            hasImage: !!imageUrl,
            clientId,
        });
        return prisma_1.prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
                select: {
                    id: true,
                    unlocked: true,
                    userAId: true,
                    userBId: true,
                },
            });
            if (!match) {
                console.error("❌ [ChatService.send] match not found", matchId);
                throw new Error("Match not found");
            }
            if (match.userAId !== senderId && match.userBId !== senderId) {
                console.error("❌ [ChatService.send] unauthorized sender", {
                    senderId,
                    match,
                });
                throw new Error("Not allowed in this match");
            }
            if (!match.unlocked && content && (0, chatFilter_1.containsBannedContent)(content)) {
                console.warn("⛔ [ChatService.send] banned content blocked");
                const err = new Error("Unlock chat to share contacts");
                err.code = "CHAT_LOCKED";
                throw err;
            }
            const msg = await tx.message.create({
                data: {
                    matchId,
                    senderId,
                    content,
                    imageUrl,
                    clientId,
                },
            });
            console.log("✅ [ChatService.send] message created", {
                id: msg.id,
                matchId,
            });
            return msg;
        });
    }
    /* =====================================================
       MARK DELIVERED
    ===================================================== */
    static async markDelivered(messageId) {
        console.log("📦 [ChatService.markDelivered] start", { messageId });
        const msg = await prisma_1.prisma.message.update({
            where: { id: messageId },
            data: { deliveredAt: new Date() },
        });
        console.log("✅ [ChatService.markDelivered] done", {
            id: msg.id,
            deliveredAt: msg.deliveredAt,
        });
        return msg;
    }
    /* =====================================================
       MARK SEEN
    ===================================================== */
    static async markSeen(matchId, userId) {
        console.log("👀 [ChatService.markSeen] start", { matchId, userId });
        return prisma_1.prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
                select: { userAId: true, userBId: true },
            });
            if (!match) {
                console.warn("⚠️ [ChatService.markSeen] match not found", matchId);
                return;
            }
            await tx.message.updateMany({
                where: {
                    matchId,
                    senderId: { not: userId },
                    seenAt: null,
                },
                data: { seenAt: new Date() },
            });
            await tx.match.update({
                where: { id: matchId },
                data: match.userAId === userId
                    ? { lastSeenUserA: new Date() }
                    : { lastSeenUserB: new Date() },
            });
            console.log("✅ [ChatService.markSeen] completed", {
                matchId,
                userId,
            });
        });
    }
    /* =====================================================
       DELETE MESSAGE (HARDENED)
    ===================================================== */
    static async deleteMessage(messageId, userId) {
        console.log("🗑️ [ChatService.deleteMessage] start", {
            messageId,
            userId,
        });
        if (!messageId) {
            console.error("❌ [ChatService.deleteMessage] missing messageId");
            throw new Error("Invalid message id");
        }
        const msg = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
            select: { id: true, senderId: true, matchId: true },
        });
        if (!msg) {
            console.error("❌ [ChatService.deleteMessage] message not found", {
                messageId,
            });
            throw new Error("Message not found");
        }
        if (msg.senderId !== userId) {
            console.error("❌ [ChatService.deleteMessage] forbidden delete", {
                messageId,
                senderId: msg.senderId,
                userId,
            });
            throw new Error("Not allowed");
        }
        const deleted = await prisma_1.prisma.message.update({
            where: { id: messageId },
            data: {
                deletedAt: new Date(),
                content: null,
                imageUrl: null,
            },
        });
        console.log("✅ [ChatService.deleteMessage] deleted", {
            id: deleted.id,
            matchId: deleted.matchId,
        });
        return deleted;
    }
    /* =====================================================
       INBOX
    ===================================================== */
    static async getInbox(userId) {
        console.log("📥 [ChatService.getInbox] start", { userId });
        const matches = await prisma_1.prisma.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                userA: {
                    select: { id: true, username: true, profilePhoto: true },
                },
                userB: {
                    select: { id: true, username: true, profilePhoto: true },
                },
            },
        });
        console.log("✅ [ChatService.getInbox] fetched", {
            count: matches.length,
        });
        return matches.map((m) => {
            const isUserA = m.userAId === userId;
            return {
                matchId: m.id,
                user: isUserA ? m.userB : m.userA,
                lastMessage: m.messages[0] ?? null,
                unlocked: m.unlocked,
                lastSeen: isUserA ? m.lastSeenUserA : m.lastSeenUserB,
            };
        });
    }
}
exports.ChatService = ChatService;
