import { Request, Response } from "express";
import { SpinService } from "../services/spin.service";

/**
 * TEMP DEV WEEK
 * Later this will be generated automatically
 */
const DEV_WEEK_ID = "2026-W01";

export class SpinController {
  /**
   * STEP 1: Check if user can spin
   * Used by frontend to show / enable the wheel
   */
  static async status(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.json({ canSpin: false });
      }

      const canSpin = await SpinService.canSpin(user.id, DEV_WEEK_ID);

      return res.json({
        canSpin,
        weekId: DEV_WEEK_ID,
      });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  }

  /**
   * STEP 2: Perform the spin
   * Backend decides the result
   */
  static async spin(req: Request, res: Response) {
    try {
      // ✅ User already authenticated by authMiddleware
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { weekId } = req.body;

      // Safety: fallback to DEV week
      const effectiveWeekId = weekId ?? DEV_WEEK_ID;

      const allowed = await SpinService.canSpin(
        user.id,
        effectiveWeekId
      );

      if (!allowed) {
        return res.status(403).json({ message: "Not eligible" });
      }

      const result = await SpinService.spin(
        user.id,
        effectiveWeekId
      );

      return res.json({
        isWinner: result.isWinner,
        amount: result.amount, // only meaningful if winner
      });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  }
}
