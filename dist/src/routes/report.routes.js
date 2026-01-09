"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../lib/db"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authMiddleware, async (req, res) => {
    const report = await db_1.default.report.create({
        data: {
            reporterId: req.user.id,
            targetId: req.body.targetId,
            reason: req.body.reason
        }
    });
    res.status(201).json(report);
});
exports.default = router;
