import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

import { ChatService } from "./services/chat.service";
import { prisma } from "./lib/prisma";

let io: Server;

/**
 * userId -> Set<socketId>
 * Handles:
 * - multiple tabs
 * - refresh safety
 * - correct online/offline state
 */
const onlineUsers = new Map<string, Set<string>>();

/* ================= INIT ================= */
export function initSocket(httpServer: any) {
  console.log("🚀 [SOCKET] Initializing Socket.IO server");

  /* ---------- CORS ---------- */
  /* ---------- CORS ---------- */
  const normalize = (url: string) =>
    url.replace(/\/$/, "").toLowerCase();

  const socketOrigins = [
    "http://localhost:3000",
    "https://instantconnect.jaodr.com", // ✅ NEW DOMAIN
    "https://instant-connect-frontend-hnh01yaf4-ayodoubleayos-projects.vercel.app",
    process.env.FRONTEND_URL,
  ]
    .filter((url): url is string => typeof url === "string")
    .map(normalize);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const normalizedOrigin = normalize(origin);

        if (socketOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        console.error("❌ [SOCKET][CORS] Blocked origin:", origin);
        callback(new Error("Not allowed by Socket.IO CORS"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });
;

  /* ================= AUTH ================= */
io.use((socket, next) => {
  try {
    let token: string | undefined;

    // 1️⃣ Try Authorization header (mobile / API clients)
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }

    // 2️⃣ Fallback to httpOnly cookie (web app)
    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      token = cookies.token;
    }

    if (!token) {
      console.error("⛔ [SOCKET][AUTH] No token found");
      return next(new Error("Unauthorized"));
    }

    // 3️⃣ Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    (socket as any).user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log("🔐 [SOCKET][AUTH] SUCCESS", {
      userId: decoded.id,
      socketId: socket.id,
    });

    next();
  } catch (err) {
    console.error("⛔ [SOCKET][AUTH] Failed", err);
    next(new Error("Unauthorized"));
  }
});



  /* ================= CONNECTION ================= */
  io.on("connection", async (socket) => {
    const userId = (socket as any).user.id;

    /* ---------- TRACK SOCKET ---------- */
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    /* ---------- FIRST SOCKET = ONLINE ---------- */
    if (onlineUsers.get(userId)!.size === 1) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { isOnline: true, lastSeenAt: null },
      });
      io.emit("user:online", { userId });
    }

    /* ================= ROOMS ================= */
    socket.on("joinMatch", (matchId: string, cb) => {
      socket.join(`match:${matchId}`);
      cb?.({ ok: true });
    });

    socket.on("leaveMatch", (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    /* ================= PRESENCE SNAPSHOT ================= */
    socket.on("presence:sync", async ({ matchId }) => {
      try {
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          select: { userAId: true, userBId: true },
        });

        if (!match) return;

        const otherUserId =
          match.userAId === userId ? match.userBId : match.userAId;

        const isOnline = onlineUsers.has(otherUserId);

        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: { lastSeenAt: true },
        });

        socket.emit("presence:state", {
          matchId,
          userId: otherUserId,
          online: isOnline,
          lastSeenAt: isOnline ? null : otherUser?.lastSeenAt,
        });
      } catch (err) {
        console.error("❌ [PRESENCE] sync error", err);
      }
    });


socket.on(
  "message:send",
  async ({ matchId, content, imageUrl, clientId }, cb) => {
    const flowId = Date.now();
    console.log("📥 [SOCKET][SERVER][message:send] START", {
      flowId,
      matchId,
      clientId,
      senderId: (socket as any).user.id,
      hasContent: !!content,
    });

    try {
      const senderId = (socket as any).user.id;

      console.log("💾 [SOCKET][SERVER] Calling ChatService.send", { flowId });
      const msg = await ChatService.send(
        senderId,
        matchId,
        content,
        imageUrl,
        clientId
      );
      console.log("💾 [SOCKET][SERVER] ChatService.send SUCCESS", {
        flowId,
        messageId: msg.id,
        clientId: msg.clientId,
      });

      const room = `match:${matchId}`;
      
      // Check who's in the room
      const socketsInRoom = await io.in(room).fetchSockets();
      console.log("🔍 [SOCKET][SERVER] Room inspection BEFORE emit", {
        flowId,
        room,
        socketCount: socketsInRoom.length,
        socketIds: socketsInRoom.map((s) => s.id),
      });

      console.log("📤 [SOCKET][SERVER] Emitting message:new to room", {
        flowId,
        room,
        messageId: msg.id,
      });

      io.to(room).emit("message:new", {
        id: msg.id,
        matchId: msg.matchId,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        deliveredAt: msg.deliveredAt,
        seenAt: msg.seenAt,
        clientId: msg.clientId, // ✅ CRITICAL
      });

      console.log("✅ [SOCKET][SERVER] message:new emitted", { flowId });

      console.log("📞 [SOCKET][SERVER] Sending ACK to sender", { flowId });
      cb?.({ ok: true, message: msg });
      console.log("✅ [SOCKET][SERVER] ACK sent", { flowId });

      console.log("🏁 [SOCKET][SERVER][message:send] END SUCCESS", { flowId });
    } catch (err: any) {
      console.error("❌ [SOCKET][SERVER][message:send] FAILED", {
        flowId,
        error: err.message,
      });
      cb?.({ ok: false, error: err.message });
    }
  }
);

``


    /* ================= DELETE MESSAGE ================= */
    socket.on("message:delete", async ({ messageId }) => {
      try {
        const userId = (socket as any).user.id;

        // 📝 Log when delete event arrives
        console.log("📥 [SOCKET][SERVER] message:delete received", { messageId, userId });

        // Service handles ownership + DB deletion
        const msg = await ChatService.deleteMessage(messageId, userId);

        // 📝 Log after service deletes message
        console.log("🗄️ [SOCKET][SERVER] Message deleted in service", { messageId: msg.id, matchId: msg.matchId, userId });

        // Broadcast deletion to everyone in the match room
        io.to(`match:${msg.matchId}`).emit("message:deleted", {
          messageId: msg.id,
        });

        // 📝 Log before broadcasting
        console.log("📤 [SOCKET][SERVER] message:deleted emitted", { messageId: msg.id, matchId: msg.matchId });
      } catch (err) {
        console.error("❌ [SOCKET] message:delete failed", err);
      }
    });

    /* ================= MESSAGE SEEN ================= */
socket.on("message:seen", async ({ matchId, messageId }) => {
  try {
    const userId = (socket as any).user.id;

    console.log("📥 [SOCKET][SERVER] message:seen received", { matchId, messageId, userId });

    // Update DB (mark message as seen)
    await prisma.message.updateMany({
      where: { id: messageId },
      data: { seenAt: new Date() },
    });

    // Broadcast to everyone in the match room
    io.to(`match:${matchId}`).emit("message:seen", {
      messageId,
      matchId,
      seenBy: userId, // optional: useful if you want to track who saw it
    });

    console.log("📤 [SOCKET][SERVER] message:seen emitted", { messageId, matchId });
  } catch (err) {
    console.error("❌ [SOCKET][SERVER] message:seen failed", err);
  }
});


    /* ================= DISCONNECT ================= */
    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(userId);

        const lastSeen = new Date();

        await prisma.user.updateMany({
          where: { id: userId },
          data: { isOnline: false, lastSeenAt: lastSeen },
        });

        io.emit("user:offline", { userId, lastSeenAt: lastSeen });
      }
    });
  });

  return io;
}

/* ================= EXPORT ================= */
export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}
