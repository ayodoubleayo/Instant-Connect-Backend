"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const prisma_1 = require("../lib/prisma");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
router.get("/inbox", auth_middleware_1.authMiddleware, chat_controller_1.getInbox);
router.post("/:matchId", auth_middleware_1.authMiddleware, upload_middleware_1.upload.single("image"), chat_controller_1.sendMessage);
router.post("/:matchId/seen", auth_middleware_1.authMiddleware, chat_controller_1.markSeen);
router.delete("/message/:messageId", auth_middleware_1.authMiddleware, chat_controller_1.deleteMessage);
router.get("/:matchId", auth_middleware_1.authMiddleware, async (req, res) => {
    const { matchId } = req.params;
    const userId = req.user.id;
    const match = await prisma_1.prisma.match.findFirst({
        where: {
            id: matchId,
            OR: [{ userAId: userId }, { userBId: userId }],
        },
    });
    if (!match)
        return res.status(403).json({ message: "Not allowed" });
    const messages = await prisma_1.prisma.message.findMany({
        where: { matchId },
        orderBy: { createdAt: "asc" },
    });
    res.json(messages);
});
exports.default = router;
