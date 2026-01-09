

import { prisma } from "@/lib/prisma";

/**
 * Anti-fraud validation before payout
 * Server-side ONLY
 */
export async function validatePayoutRequest(params: {
  userId: string;
  accountNumber: string;
}) {
  const { userId, accountNumber } = params;

  /**
   * 1️⃣ One payout per user at a time
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
      accountNumber, // ✅ REAL DB FIELD
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  if (existingBankUse) {
    throw new Error("Bank account already used");
  }

  return true;
}
