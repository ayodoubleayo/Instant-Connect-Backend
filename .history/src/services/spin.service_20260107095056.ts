import { prisma } from "../lib/prisma";

const AMOUNTS = [100, 200, 500];
const MAX_WINNERS = 5;

export class SpinService {
  static async canSpin(userId: string, weekId: string) {
    const eligible = await prisma.weeklyLeaderboard.findFirst({
      where: { userId, weekId },
    });

    if (!eligible) return false;

    const alreadySpun = await prisma.spinResult.findFirst({
      where: { userId, weekId },
    });

    return !alreadySpun;
  }

  static async spin(userId: string, weekId: string) {
    return prisma.$transaction(async (tx) => {
      const winnersCount = await tx.spinResult.count({
        where: { weekId, isWinner: true },
      });

      let isWinner = false;
      let amount: number | null = null;

      if (winnersCount < MAX_WINNERS) {
        // probability increases as slots remain
        const chance = (MAX_WINNERS - winnersCount) / 50;
        isWinner = Math.random() < chance;
      }

      if (isWinner) {
        amount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
      }

      const result = await tx.spinResult.create({
        data: {
          userId,
          weekId,
          isWinner,
          amount,
        },
      });

      return result;
    });
  }
}
