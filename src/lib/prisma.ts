import { PrismaClient } from "@prisma/client";

console.log("🟣 [Prisma] prisma.ts loaded");

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    console.log("🟢 [Prisma] Creating NEW PrismaClient instance");

    return new PrismaClient({
      log: ["error", "warn"], // production-safe logging
    });
  })();

if (process.env.NODE_ENV !== "production") {
  console.log("🟡 [Prisma] Reusing PrismaClient in dev (global scope)");
  globalForPrisma.prisma = prisma;
}

console.log("🟢 [Prisma] PrismaClient READY");
