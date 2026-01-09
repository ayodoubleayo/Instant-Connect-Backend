"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitPayout = submitPayout;
const payout_service_1 = require("../services/payout.service");
async function submitPayout(req, res) {
    const user = req.user;
    // ✅ AUTH GUARD (Option A)
    if (!user) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }
    const { token, bank, accountNumber, accountName } = req.body;
    // ✅ INPUT VALIDATION
    if (!token || !bank || !accountNumber || !accountName) {
        return res.status(400).json({
            error: "Missing required fields",
        });
    }
    try {
        const payout = await (0, payout_service_1.submitPayoutService)({
            userId: user.id, // ✅ SAFE now
            token,
            bank,
            accountNumber,
            accountName,
        });
        return res.status(201).json({
            success: true,
            payoutId: payout.id,
        });
    }
    catch (err) {
        return res.status(400).json({
            error: err.message || "Unable to submit payout",
        });
    }
}
