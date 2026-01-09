import { prisma } from "../lib/prisma";

export class PayoutService {
  static async requestPayout(
    userId: string,
    spinId: string,
    bank: string,
    accountNumber: string,
    accountName: string
  ) {
    // Anti-fraud: same bank + account
    const duplicate = await prisma.payoutRequest.findFirst({
      where: {
        bank,
        accountNumber,
        status: { not: "REJECTED" },
      },
    });

    if (duplicate) {
      throw new Error("Duplicate payout detected");
    }

    return prisma.payoutRequest.create({
      data: {
        userId,
        spinId,
        bank,
        accountNumber,
        accountName,
      },
    });
  }
}
