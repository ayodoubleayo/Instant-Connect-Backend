import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

function isProfileComplete(user: any) {
  return (
    !!user.bio &&
    !!user.profilePhoto &&
    !!user.relationshipIntent &&
    !!user.religion &&
    Array.isArray(user.preferredTribes) &&
    user.preferredTribes.length > 0
  );
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;

    
    const user = await prisma.user.findUnique({
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

    
    const match = await prisma.match.findUnique({
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

    
    const forbiddenPattern =
      /(http|www\.|wa\.me|@|instagram|telegram|\+?\d{10,})/i;

    if (!match.unlocked && forbiddenPattern.test(content)) {
      return res.status(403).json({
        message: "Payment required to share contact information",
        code: "CHAT_LOCKED",
      });
    }

    
    await prisma.message.create({
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
  } catch (error) {
    return res.status(500).json({ message: "Chat error" });
  }
};
