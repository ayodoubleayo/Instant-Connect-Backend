"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.markSeen = exports.getInbox = exports.sendMessage = void 0;
const chat_service_1 = require("../services/chat.service");
const socket_1 = require("../socket");
const prisma_1 = require("../lib/prisma");
const sendMessage = async (req, res) => {
    const flowId = Date.now(); // 🔎 flow correlation
    try {
        const { matchId } = req.params;
        const { content, clientId } = req.body;
        const userId = req.user.id;
        console.log("🚀 [SEND] START", {
            flowId,
            userId,
            matchId,
            clientId,
            hasContent: !!content,
        });
        /* ================= PAYWALL GUARD ================= */
        const match = await prisma_1.prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match?.unlocked) {
            console.warn("⛔ [SEND] CHAT LOCKED", {
                flowId,
                matchId,
                userId,
            });
            return res.status(403).json({
                message: "Chat locked. Payment required.",
            });
        }
        /* ================= SAVE MESSAGE ================= */
        const message = await chat_service_1.ChatService.send(userId, matchId, content, undefined, clientId);
        console.log("💾 [SEND] MESSAGE SAVED", {
            flowId,
            messageId: message.id,
            clientId: message.clientId,
        });
        const io = (0, socket_1.getIO)();
        const room = `match:${matchId}`;
        /* ================= ROOM INSPECTION ================= */
        const socketsInRoom = await io.in(room).fetchSockets();
        console.log("🔍 [SEND] ROOM STATE BEFORE EMIT", {
            flowId,
            room,
            socketsInRoom: socketsInRoom.map((s) => s.id),
            socketCount: socketsInRoom.length,
        });
        /* ================= EMIT MESSAGE ================= */
        io.to(room).emit("message:new", message);
        /* ================= INBOX UPDATE ================= */
        io.emit("inbox:update", {
            matchId,
            message,
        });
        console.log("🏁 [SEND] END SUCCESS", {
            flowId,
            messageId: message.id,
        });
        res.json(message);
    }
    catch (err) {
        if (err.code === "CHAT_LOCKED") {
            return res.status(403).json({
                message: err.message,
                code: "CHAT_LOCKED",
            });
        }
        console.error("❌ [SEND] FAILED", err);
        res.status(500).json({ message: "Chat error" });
    }
};
exports.sendMessage = sendMessage;
/* =========================
   INBOX
========================= */
const getInbox = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("📥 [INBOX] FETCH", { userId });
        const inbox = await chat_service_1.ChatService.getInbox(userId);
        res.json(inbox);
    }
    catch (err) {
        console.error("❌ [INBOX] ERROR", err);
        res.status(500).json({ message: "Inbox error" });
    }
};
exports.getInbox = getInbox;
/* ================= MARK SEEN ================= */
const markSeen = async (req, res) => {
    const userId = req.user.id;
    const { matchId } = req.params;
    await chat_service_1.ChatService.markSeen(matchId, userId);
    (0, socket_1.getIO)().to(`match:${matchId}`).emit("message:seen", {
        matchId,
        userId,
    });
    res.json({ ok: true });
};
exports.markSeen = markSeen;
/* ================= DELETE MESSAGE ================= */
const deleteMessage = async (req, res) => {
    const userId = req.user.id;
    const { messageId } = req.params;
    const msg = await chat_service_1.ChatService.deleteMessage(messageId, userId);
    (0, socket_1.getIO)()
        .to(`match:${msg.matchId}`)
        .emit("message:deleted", msg.id);
    res.json({ ok: true });
};
exports.deleteMessage = deleteMessage;
