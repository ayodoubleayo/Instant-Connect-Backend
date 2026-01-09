"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFeedback = exports.getAllFeedback = exports.createFeedback = void 0;
const prisma_1 = require("../lib/prisma");
/* =========================
   CREATE FEEDBACK
========================= */
const createFeedback = async (req, res) => {
    const me = req.user;
    const { type, message } = req.body;
    if (!me) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!type || !message) {
        return res.status(400).json({ message: "Type and message required" });
    }
    const feedback = await prisma_1.prisma.feedback.create({
        data: {
            userId: me.id,
            type,
            message,
        },
    });
    res.json(feedback);
};
exports.createFeedback = createFeedback;
/* =========================
   ADMIN: GET ALL FEEDBACK
========================= */
const getAllFeedback = async (_req, res) => {
    const feedback = await prisma_1.prisma.feedback.findMany({
        include: {
            user: {
                select: {
                    username: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(feedback);
};
exports.getAllFeedback = getAllFeedback;
/* =========================
   ADMIN: MARK RESOLVED
========================= */
const resolveFeedback = async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.feedback.update({
        where: { id },
        data: { resolved: true },
    });
    res.json({ success: true });
};
exports.resolveFeedback = resolveFeedback;
