"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitPayoutService = submitPayoutService;
const prisma_1 = require("../lib/prisma");
async function submitPayoutService(input) {
    const { userId, token, bank, accountNumber, accountName } = input;
    // 1️⃣ Find token
    const payoutToken = await prisma_1.prisma.payoutToken.findUnique({
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
    return await prisma_1.prisma.$transaction(async (tx) => {
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
