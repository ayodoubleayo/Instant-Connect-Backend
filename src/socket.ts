import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
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

  /* ---------- CORS (LOCKED + TYPE-SAFE) ---------- */
  const socketOrigins: string[] = [
    "http://localhost:3000",
    "https://instant-connect-frontend-hnh01yaf4-ayodoubleayos-projects.vercel.app",
  ];

  if (process.env.FRONTEND_URL) {
    socketOrigins.push(process.env.FRONTEND_URL);
  }

  io = new Server(httpServer, {
    cors: {
      origin: socketOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  /* ================= AUTH ================= */
  io.use((socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie;
      if (!raw) return next(new Error("Unauthorized"));

      const parsed = cookie.parse(raw);
      const token = parsed.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as any;

      (socket as any).user = decoded;
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
          match.userAId === userId
            ? match.userBId
            : match.userAId;

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
