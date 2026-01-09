"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
/* =========================
   AUTH ROUTES
========================= */
// Public auth routes
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.post("/logout", auth_controller_1.logout);
// Forgot password (public, safe)
router.post("/forgot-password", auth_controller_1.forgotPassword);
exports.default = router;
