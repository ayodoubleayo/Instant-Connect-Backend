import { prisma } from "../lib/prisma";

type SubmitPayoutInput = {
  userId: string;
  token: string;
  bank: string;
  accountNumber: string;
  accountName: string;
};

export async function submitPayoutService(input: SubmitPayoutInput) {
  const { userId, token, bank, accountNumber, accountName } = input;

  // 1️⃣ Find token
  const payoutToken = await prisma.payoutToken.findUnique({
    where: { token },
  });

  if (!payoutToken) {
    throw new Error("Invalid payout token");
  }

  // 2️⃣ Ownership check
  if (payoutToken.userId !== userId) {
    throw new Error("Token does not belong to user");
  }

  // 3️⃣ Expiry check
  if (payoutToken.expiresAt < new Date()) {
    throw new Error("Payout token expired");
  }

  // 4️⃣ Replay protection
  if (payoutToken.usedAt) {
    throw new Error("Payout token already used");
  }

  // 5️⃣ Atomic transaction
  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.create({
      data: {
        userId,
        tokenId: payoutToken.id,
        bank,
        accountNumber,
        accountName,
      },
    });

    await tx.payoutToken.update({
      where: { id: payoutToken.id },
      data: {
        usedAt: new Date(),
      },
    });

    return payout;
  });
}
