import cron from "node-cron";
import { prisma } from "../lib/prisma";

cron.schedule("0 0 * * 1", async () => {
  await prisma.spinResult.deleteMany({});
});
