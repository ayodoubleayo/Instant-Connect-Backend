"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
/**
 * Global Prisma instance
 * Prevents exhausting DB connections in dev
 */
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
exports.default = exports.prisma;
