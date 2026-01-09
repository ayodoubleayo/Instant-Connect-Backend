import cron from "node-cron";
import { ReferralService } from "../services/referral.service";

cron.schedule("0 0 * * 1", async () => {
  const weekId = new Date().toISOString().slice(0, 10);
  await ReferralService.generateLeaderboard(weekId);
});
