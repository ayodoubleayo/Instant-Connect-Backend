import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ChatService } from "./services/chat.service";
import { prisma } from "./lib/prisma";

let io: Server;

/**
 * Track online users safely
 * userId -> Set of active socketIds
 *
 * WHY:
 * - Handles multiple tabs
 * - Prevents false offline on refresh
 * - Industry-standard presence handling
 */
const onlineUsers = new Map<string, Set<string>>();

export function initSocket(httpServer: any) {
  console.log("🚀 [SOCKET] Initializing Socket.IO server");

  io = new Server(httpServer, {
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

      const parsed = cookie.parse(raw);
      const token = parsed.token;
      if (!token) {
        console.warn("⛔ [SOCKET][AUTH] Missing JWT token");
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as any;

      (socket as any).user = decoded;

      console.log("🔐 [SOCKET][AUTH] Authenticated", {
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

    console.log("🟢 [SOCKET][CONNECT]", {
      userId,
      socketId: socket.id,
    });

    /** ---------- TRACK SOCKET ---------- */
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId)!.add(socket.id);

    console.log("📊 [PRESENCE] socket added", {
      userId,
      activeSockets: Array.from(onlineUsers.get(userId)!),
    });

    /** ---------- MARK ONLINE (FIRST SOCKET ONLY) ---------- */
    if (onlineUsers.get(userId)!.size === 1) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { isOnline: true, lastSeenAt: null },
      });

      io.emit("user:online", { userId });

      console.log("🟢 [PRESENCE] user ONLINE", { userId });
    }

    /* ================= JOIN MATCH ================= */
    socket.on("joinMatch", async (matchId: string, cb) => {
      console.log("➡️ [ROOM] joinMatch", {
        userId,
        socketId: socket.id,
        matchId,
      });

      socket.join(`match:${matchId}`);

      cb?.({ ok: true });
    });

    socket.on("leaveMatch", (matchId: string) => {
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
    const userId = (socket as any).user.id;

    // 1️⃣ Load match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        userAId: true,
        userBId: true,
      },
    });

    if (!match) return;

    // 2️⃣ Identify the OTHER user
    const otherUserId =
      match.userAId === userId
        ? match.userBId
        : match.userAId;

    // 3️⃣ Check online status from memory
    const isOnline = onlineUsers.has(otherUserId);

    // 4️⃣ Fetch lastSeen from DB
    const otherUser = await prisma.user.findUnique({
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
  } catch (err) {
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
        const msg = await ChatService.markDelivered(id);

        io.to(`match:${msg.matchId}`).emit("message:delivered", {
          id: msg.id,
          clientId,
          deliveredAt: msg.deliveredAt,
        });

        console.log("📦 [MESSAGE] delivered", {
          messageId: msg.id,
          matchId: msg.matchId,
        });
      } catch (e) {
        console.error("❌ [MESSAGE] delivered error", e);
      }
    });

    /* ================= SEEN ================= */
    socket.on("message:seen", async ({ matchId }) => {
      try {
        await ChatService.markSeen(matchId, userId);

        socket.to(`match:${matchId}`).emit("message:seen", {
          matchId,
          userId,
        });

        console.log("👀 [MESSAGE] seen", { matchId, userId });
      } catch (e) {
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
        const msg = await ChatService.deleteMessage(
          messageId,
          userId
        );

        io.to(`match:${msg.matchId}`).emit("message:delete", {
          messageId: msg.id,
        });

        console.log("📡 [MESSAGE] delete broadcast", {
          matchId: msg.matchId,
          messageId: msg.id,
        });
      } catch (e) {
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
      if (!sockets) return;

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
  await prisma.user.updateMany({
    where: { id: userId },
    data: { isOnline: false, lastSeenAt: lastSeen },
  });
} catch (err) {
  console.error(
    "⚠️ [SOCKET][PRESENCE][OFFLINE_DB_FAILED]",
    err
  );
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
export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}
