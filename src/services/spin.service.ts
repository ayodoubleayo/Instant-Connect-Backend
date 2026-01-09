import { prisma } from "../lib/prisma";

const AMOUNTS = [100, 200, 500];
const MAX_WINNERS = 5;

export class SpinService {
  /* =========================
     CHECK IF USER CAN SPIN
     ========================= */
  static async canSpin(userId: string, weekId: string) {
    console.log("🎯 [SpinService.canSpin] START", {
      userId,
      weekId,
    });

    // 1️⃣ Check leaderboard eligibility
    const eligible = await prisma.weeklyLeaderboard.findFirst({
      where: { userId, weekId },
    });

    console.log("📊 [SpinService.canSpin] leaderboard check", {
      eligible: !!eligible,
    });

    if (!eligible) {
      console.log("⛔ [SpinService.canSpin] NOT ELIGIBLE");
      return false;
    }

    // 2️⃣ Check if already spun
    const alreadySpun = await prisma.spinResult.findFirst({
      where: { userId, weekId },
    });

    console.log("🔁 [SpinService.canSpin] already spun?", {
      alreadySpun: !!alreadySpun,
    });

    const canSpin = !alreadySpun;

    console.log("✅ [SpinService.canSpin] RESULT", {
      canSpin,
    });

    return canSpin;
  }

  /* =========================
     PERFORM SPIN
     ========================= */
  static async spin(userId: string, weekId: string) {
    console.log("🎰 [SpinService.spin] START", {
      userId,
      weekId,
    });

    return prisma.$transaction(async (tx) => {
      // 1️⃣ Count winners so far
      const winnersCount = await tx.spinResult.count({
        where: { weekId, isWinner: true },
      });

      console.log("🏆 [SpinService.spin] winners so far", {
        winnersCount,
        MAX_WINNERS,
      });

      let isWinner = false;
      let amount: number | null = null;

      // 2️⃣ Decide win
      if (winnersCount < MAX_WINNERS) {
        const chance = (MAX_WINNERS - winnersCount) / 50;
        isWinner = Math.random() < chance;

        console.log("🎲 [SpinService.spin] chance roll", {
          chance,
          isWinner,
        });
      }

      // 3️⃣ Assign amount if winner
      if (isWinner) {
        amount =
          AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];

        console.log("💰 [SpinService.spin] WIN AMOUNT", {
          amount,
        });
      }

      // 4️⃣ Persist result
      const result = await tx.spinResult.create({
        data: {
          userId,
          weekId,
          isWinner,
          amount,
        },
      });

      console.log("📝 [SpinService.spin] RESULT SAVED", {
        resultId: result.id,
        isWinner,
        amount,
      });

      return result;
    });
  }
}
