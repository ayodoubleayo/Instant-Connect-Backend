"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const prisma_1 = require("../lib/prisma");
function isProfileComplete(user) {
    return (!!user.bio &&
        !!user.profilePhoto &&
        !!user.relationshipIntent &&
        !!user.religion &&
        Array.isArray(user.preferredTribes) &&
        user.preferredTribes.length > 0);
}
const sendMessage = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                bio: true,
                profilePhoto: true,
                relationshipIntent: true,
                religion: true,
                preferredTribes: true,
            },
        });
        if (!user || !isProfileComplete(user)) {
            return res.status(403).json({
                message: "Complete your profile to send messages",
                code: "PROFILE_INCOMPLETE",
            });
        }
        const match = await prisma_1.prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                unlocked: true,
                userAId: true,
                userBId: true,
            },
        });
        if (!match) {
            return res.status(404).json({ message: "Match not found" });
        }
        if (match.userAId !== userId && match.userBId !== userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        const forbiddenPattern = /(http|www\.|wa\.me|@|instagram|telegram|\+?\d{10,})/i;
        if (!match.unlocked && forbiddenPattern.test(content)) {
            return res.status(403).json({
                message: "Payment required to share contact information",
                code: "CHAT_LOCKED",
            });
        }
        await prisma_1.prisma.message.create({
            data: {
                matchId,
                senderId: userId,
                content,
            },
        });
        return res.json({
            success: true,
            message: "Message sent",
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Chat error" });
    }
};
exports.sendMessage = sendMessage;
