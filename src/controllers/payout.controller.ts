import { Request, Response } from "express";
import { submitPayoutService } from "../services/payout.service";

export async function submitPayout(req: Request, res: Response) {
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
    const payout = await submitPayoutService({
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
  } catch (err: any) {
    return res.status(400).json({
      error: err.message || "Unable to submit payout",
    });
  }
}
