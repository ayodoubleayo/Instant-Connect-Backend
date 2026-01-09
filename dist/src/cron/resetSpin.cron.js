"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../lib/prisma");
node_cron_1.default.schedule("0 0 * * 1", async () => {
    await prisma_1.prisma.spinResult.deleteMany({});
});
