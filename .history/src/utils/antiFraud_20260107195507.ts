import { prisma } from "@/lib/prisma";

/**
 * Anti-fraud validation before payout
 */
export async function validatePayoutRequest(params: {
  userId: string;
  bankAccount: string;
}) {
  const { userId, bankAccount } = params;

  /**
   * 1️⃣ One payout per user per week
   */
  const existingUserPayout = await prisma.payoutRequest.findFirst({
    where: {
      userId,
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  if (existingUserPayout) {
    throw new Error("User already has a payout request");
  }

  /**
   * 2️⃣ Bank account reuse detection
   */
  const existingBankUse = await prisma.payoutRequest.findFirst({
    where: {
      bankAccount,
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  if (existingBankUse) {
    throw new Error("Bank account already used");
  }

  return true;
}
