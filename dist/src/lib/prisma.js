"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
console.log("🟣 [Prisma] prisma.ts loaded");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ??
    (() => {
        console.log("🟢 [Prisma] Creating NEW PrismaClient instance");
        return new client_1.PrismaClient({
            log: ["error", "warn"], // production-safe logging
        });
    })();
if (process.env.NODE_ENV !== "production") {
    console.log("🟡 [Prisma] Reusing PrismaClient in dev (global scope)");
    globalForPrisma.prisma = exports.prisma;
}
console.log("🟢 [Prisma] PrismaClient READY");
