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
    console.log("🟢 [SPIN → STATUS] Request received");

    try {
      const user = (req as any).user;

      console.log("🧍 [SPIN → STATUS] Auth user:", user?.id ?? "NO USER");

      if (!user) {
        console.log("⛔ [SPIN → STATUS] No user → cannot spin");
        return res.json({ canSpin: false });
      }

      console.log("🔍 [SPIN → STATUS] Checking eligibility in service…");

      const canSpin = await SpinService.canSpin(user.id, DEV_WEEK_ID);

      console.log("✅ [SPIN → STATUS] Eligibility result:", {
        userId: user.id,
        canSpin,
        weekId: DEV_WEEK_ID,
      });

      return res.json({
        canSpin,
        weekId: DEV_WEEK_ID,
      });
    } catch (e: any) {
      console.error("🔥 [SPIN → STATUS] Error:", e.message);
      return res.status(400).json({ message: e.message });
    }
  }

  /**
   * STEP 2: Perform the spin
   * Backend decides the result
   */
  static async spin(req: Request, res: Response) {
    console.log("🟢 [SPIN → EXECUTE] Request received");

    try {
      const user = (req as any).user;

      console.log("🧍 [SPIN → EXECUTE] Auth user:", user?.id ?? "NO USER");

      if (!user) {
        console.log("⛔ [SPIN → EXECUTE] Unauthorized access");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { weekId } = req.body;

      const effectiveWeekId = weekId ?? DEV_WEEK_ID;

      console.log("📦 [SPIN → EXECUTE] Payload:", {
        weekId,
        effectiveWeekId,
      });

      console.log("🔍 [SPIN → EXECUTE] Re-checking eligibility…");

      const allowed = await SpinService.canSpin(
        user.id,
        effectiveWeekId
      );

      console.log("🧪 [SPIN → EXECUTE] Eligibility result:", allowed);

      if (!allowed) {
        console.log("⛔ [SPIN → EXECUTE] User not eligible to spin");
        return res.status(403).json({ message: "Not eligible" });
      }

      console.log("🎡 [SPIN → EXECUTE] Performing spin…");

      const result = await SpinService.spin(
        user.id,
        effectiveWeekId
      );

      console.log("🎉 [SPIN → EXECUTE] Spin result:", result);

      return res.json({
        isWinner: result.isWinner,
        amount: result.amount,
      });
    } catch (e: any) {
      console.error("🔥 [SPIN → EXECUTE] Error:", e.message);
      return res.status(400).json({ message: e.message });
    }
  }
}
