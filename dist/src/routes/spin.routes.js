"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const spin_controller_1 = require("../controllers/spin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/status", auth_middleware_1.authMiddleware, spin_controller_1.SpinController.status);
router.post("/", auth_middleware_1.authMiddleware, spin_controller_1.SpinController.spin); // 🔐 Protect spin
exports.default = router;
