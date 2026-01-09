import { prisma } from "../lib/prisma";

export class ReferralService {
  static async countWeeklyReferrals(userId: string, weekId: string) {
    return prisma.referral.count({
      where: {
        referrerId: userId,
        weekId,
      },
    });
  }

  static async generateLeaderboard(weekId: string) {
    const leaderboard = await prisma.referral.groupBy({
      by: ["referrerId"],
      where: { weekId },
      _count: true,
      orderBy: {
        _count: { referrerId: "desc" },
      },
      take: 50,
    });

    await prisma.weeklyLeaderboard.deleteMany({ where: { weekId } });

    for (const row of leaderboard) {
      await prisma.weeklyLeaderboard.create({
        data: {
          weekId,
          userId: row.referrerId,
          referralCount: row._count.referrerId,
        },
      });
    }
  }
}
