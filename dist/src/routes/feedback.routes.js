"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedback_controller_1 = require("../controllers/feedback.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = (0, express_1.Router)();
// User
router.post("/", auth_middleware_1.authMiddleware, feedback_controller_1.createFeedback);
// Admin
router.get("/", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, feedback_controller_1.getAllFeedback);
router.patch("/:id/resolve", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, feedback_controller_1.resolveFeedback);
exports.default = router;
