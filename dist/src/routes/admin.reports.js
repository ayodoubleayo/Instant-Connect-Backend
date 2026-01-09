"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/report.routes.ts
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = (0, express_1.Router)();
router.get("/reports", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, async (_req, res) => {
    const reports = await prisma_1.prisma.report.findMany();
    res.json(reports);
});
exports.default = router;
