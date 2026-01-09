"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
/* ======================================================
   ADMIN DASHBOARD
====================================================== */
router.get("/stats", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, admin_controller_1.getAdminStats);
/* ======================================================
   ADMIN PAYMENTS
====================================================== */
router.get("/payments", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, admin_controller_1.getAdminPayments);
router.post("/payments/:id/approve", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, admin_controller_1.approvePayment);
/* ======================================================
   ADMIN USERS (GOVERNANCE)
====================================================== */
router.get("/users", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, admin_controller_1.getAdminUsers);
router.post("/users/:id/suspend", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, admin_controller_1.toggleSuspendUser);
router.post("/users/:id/block", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, admin_controller_1.toggleBlockUser);
/* ======================================================
   ADMIN WINNERS & PAYOUTS
====================================================== */
router.get("/winners", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware);
router.post("/payouts/:id/paid", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware);
exports.default = router;
