import { Request, Response } from "express";
import { SpinService } from "../services/spin.service";

export class SpinController {
  static async spin(req: Request, res: Response) {
    try {
      // ✅ User already authenticated by authMiddleware
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { weekId } = req.body;

      const allowed = await SpinService.canSpin(user.id, weekId);
      if (!allowed) {
        return res.status(403).json({ message: "Not eligible" });
      }

      const result = await SpinService.spin(user.id, weekId);

      res.json({
        isWinner: result.isWinner,
        amount: result.amount, // ONLY winner sees this
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
