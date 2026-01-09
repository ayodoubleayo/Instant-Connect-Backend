import { Request, Response } from "express";
import { ChatService } from "../services/chat.service";
import { getIO } from "../socket";
import cloudinary from "../lib/cloudinary";
import { prisma } from "../lib/prisma";

export const sendMessage = async (req: any, res: Response) => {
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
const match = await prisma.match.findUnique({
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
    const message = await ChatService.send(
      userId,
      matchId,
      content,
      undefined,
      clientId
    );

    console.log("💾 [SEND] MESSAGE SAVED", {
      flowId,
      messageId: message.id,
      clientId: message.clientId,
    });

    const io = getIO();
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
  } catch (err: any) {
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

/* =========================
   INBOX
========================= */
export const getInbox = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    console.log("📥 [INBOX] FETCH", { userId });

    const inbox = await ChatService.getInbox(userId);

    res.json(inbox);
  } catch (err) {
    console.error("❌ [INBOX] ERROR", err);
    res.status(500).json({ message: "Inbox error" });
  }
};

/* ================= MARK SEEN ================= */
export const markSeen = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { matchId } = req.params;

  await ChatService.markSeen(matchId, userId);

  getIO().to(`match:${matchId}`).emit("message:seen", {
    matchId,
    userId,
  });

  res.json({ ok: true });
};

/* ================= DELETE MESSAGE ================= */
export const deleteMessage = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { messageId } = req.params;

  const msg = await ChatService.deleteMessage(messageId, userId);

  getIO()
    .to(`match:${msg.matchId}`)
    .emit("message:deleted", msg.id);

  res.json({ ok: true });
};
