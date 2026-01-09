"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = __importDefault(require("cookie"));
const chat_service_1 = require("./services/chat.service");
const prisma_1 = require("./lib/prisma");
let io;
/**
 * Track online users safely
 * userId -> Set of active socketIds
 *
 * WHY:
 * - Handles multiple tabs
 * - Prevents false offline on refresh
 * - Industry-standard presence handling
 */
const onlineUsers = new Map();
function initSocket(httpServer) {
    console.log("🚀 [SOCKET] Initializing Socket.IO server");
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: ["http://localhost:3000"],
            credentials: true,
            methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
    });
    /* ================= AUTH MIDDLEWARE ================= */
    io.use((socket, next) => {
        try {
            const raw = socket.handshake.headers.cookie;
            if (!raw) {
                console.warn("⛔ [SOCKET][AUTH] Missing cookies");
                return next(new Error("Unauthorized"));
            }
            const parsed = cookie_1.default.parse(raw);
            const token = parsed.token;
            if (!token) {
                console.warn("⛔ [SOCKET][AUTH] Missing JWT token");
                return next(new Error("Unauthorized"));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            console.log("🔐 [SOCKET][AUTH] Authenticated", {
                userId: decoded.id,
                socketId: socket.id,
            });
            next();
        }
        catch (err) {
            console.error("⛔ [SOCKET][AUTH] Failed", err);
            next(new Error("Unauthorized"));
        }
    });
    /* ================= CONNECTION ================= */
    io.on("connection", async (socket) => {
        const userId = socket.user.id;
        console.log("🟢 [SOCKET][CONNECT]", {
            userId,
            socketId: socket.id,
        });
        /** ---------- TRACK SOCKET ---------- */
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);
        console.log("📊 [PRESENCE] socket added", {
            userId,
            activeSockets: Array.from(onlineUsers.get(userId)),
        });
        /** ---------- MARK ONLINE (FIRST SOCKET ONLY) ---------- */
        if (onlineUsers.get(userId).size === 1) {
            await prisma_1.prisma.user.updateMany({
                where: { id: userId },
                data: { isOnline: true, lastSeenAt: null },
            });
            io.emit("user:online", { userId });
            console.log("🟢 [PRESENCE] user ONLINE", { userId });
        }
        /* ================= JOIN MATCH ================= */
        socket.on("joinMatch", async (matchId, cb) => {
            console.log("➡️ [ROOM] joinMatch", {
                userId,
                socketId: socket.id,
                matchId,
            });
            socket.join(`match:${matchId}`);
            cb?.({ ok: true });
        });
        socket.on("leaveMatch", (matchId) => {
            console.log("⬅️ [ROOM] leaveMatch", {
                userId,
                socketId: socket.id,
                matchId,
            });
            socket.leave(`match:${matchId}`);
        });
        /* ================= PRESENCE SYNC (SNAPSHOT) ================= */
        socket.on("presence:sync", async ({ matchId }) => {
            try {
                const userId = socket.user.id;
                // 1️⃣ Load match
                const match = await prisma_1.prisma.match.findUnique({
                    where: { id: matchId },
                    select: {
                        userAId: true,
                        userBId: true,
                    },
                });
                if (!match)
                    return;
                // 2️⃣ Identify the OTHER user
                const otherUserId = match.userAId === userId
                    ? match.userBId
                    : match.userAId;
                // 3️⃣ Check online status from memory
                const isOnline = onlineUsers.has(otherUserId);
                // 4️⃣ Fetch lastSeen from DB
                const otherUser = await prisma_1.prisma.user.findUnique({
                    where: { id: otherUserId },
                    select: { lastSeenAt: true },
                });
                // 5️⃣ Send snapshot ONLY to requester
                socket.emit("presence:state", {
                    matchId,
                    userId: otherUserId,
                    online: isOnline,
                    lastSeenAt: isOnline ? null : otherUser?.lastSeenAt,
                });
                console.log("📡 [PRESENCE] sync sent", {
                    matchId,
                    otherUserId,
                    online: isOnline,
                });
            }
            catch (err) {
                console.error("❌ [PRESENCE] sync error", err);
            }
        });
        /* ================= TYPING ================= */
        socket.on("typing:start", ({ matchId }) => {
            socket.to(`match:${matchId}`).emit("typing:start", { userId });
        });
        socket.on("typing:stop", ({ matchId }) => {
            socket.to(`match:${matchId}`).emit("typing:stop", { userId });
        });
        /* ================= DELIVERED ================= */
        socket.on("message:delivered", async ({ id, clientId }) => {
            try {
                const msg = await chat_service_1.ChatService.markDelivered(id);
                io.to(`match:${msg.matchId}`).emit("message:delivered", {
                    id: msg.id,
                    clientId,
                    deliveredAt: msg.deliveredAt,
                });
                console.log("📦 [MESSAGE] delivered", {
                    messageId: msg.id,
                    matchId: msg.matchId,
                });
            }
            catch (e) {
                console.error("❌ [MESSAGE] delivered error", e);
            }
        });
        /* ================= SEEN ================= */
        socket.on("message:seen", async ({ matchId }) => {
            try {
                await chat_service_1.ChatService.markSeen(matchId, userId);
                socket.to(`match:${matchId}`).emit("message:seen", {
                    matchId,
                    userId,
                });
                console.log("👀 [MESSAGE] seen", { matchId, userId });
            }
            catch (e) {
                console.error("❌ [MESSAGE] seen error", e);
            }
        });
        /* ================= DELETE ================= */
        socket.on("message:delete", async ({ messageId }) => {
            console.log("🗑️ [MESSAGE] delete request", {
                userId,
                messageId,
            });
            try {
                const msg = await chat_service_1.ChatService.deleteMessage(messageId, userId);
                io.to(`match:${msg.matchId}`).emit("message:delete", {
                    messageId: msg.id,
                });
                console.log("📡 [MESSAGE] delete broadcast", {
                    matchId: msg.matchId,
                    messageId: msg.id,
                });
            }
            catch (e) {
                console.error("❌ [MESSAGE] delete error", e);
            }
        });
        /* ================= DISCONNECT ================= */
        socket.on("disconnect", async (reason) => {
            console.log("🔴 [SOCKET][DISCONNECT]", {
                userId,
                socketId: socket.id,
                reason,
            });
            const sockets = onlineUsers.get(userId);
            if (!sockets)
                return;
            sockets.delete(socket.id);
            console.log("📊 [PRESENCE] socket removed", {
                userId,
                remainingSockets: Array.from(sockets),
            });
            /** ---------- LAST SOCKET ONLY ---------- */
            if (sockets.size === 0) {
                onlineUsers.delete(userId);
                const lastSeen = new Date();
                try {
                    await prisma_1.prisma.user.updateMany({
                        where: { id: userId },
                        data: { isOnline: false, lastSeenAt: lastSeen },
                    });
                }
                catch (err) {
                    console.error("⚠️ [SOCKET][PRESENCE][OFFLINE_DB_FAILED]", err);
                }
                io.emit("user:offline", { userId, lastSeenAt: lastSeen });
                io.emit("user:offline", { userId, lastSeenAt: lastSeen });
                console.log("🔴 [PRESENCE] user OFFLINE", {
                    userId,
                    lastSeen,
                });
            }
        });
    });
    return io;
}
/* ================= EXPORT IO ================= */
function getIO() {
    if (!io)
        throw new Error("Socket not initialized");
    return io;
}
