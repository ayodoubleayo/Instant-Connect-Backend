"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const match_controller_1 = require("../controllers/match.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/:id", auth_middleware_1.authMiddleware, match_controller_1.getMatchById);
router.get("/:id/contact", auth_middleware_1.authMiddleware, match_controller_1.getMatchContact); // ✅ NEW
router.post("/start/:userId", auth_middleware_1.authMiddleware, match_controller_1.startChat);
exports.default = router;
