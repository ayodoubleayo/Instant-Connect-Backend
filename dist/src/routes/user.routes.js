"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* =========================
   ROUTE ENTRY LOGGER
   ========================= */
router.use((req, _res, next) => {
    console.log("➡️ [UserRoutes] HIT", {
        method: req.method,
        path: req.originalUrl,
    });
    next();
});
/* =========================
   PRIVATE — PROFILE
   ========================= */
router.get("/me", auth_middleware_1.authMiddleware, (req, res) => {
    console.log("🔐 [UserRoutes] /me → getProfile");
    return (0, user_controller_1.getProfile)(req, res);
});
router.put("/me", auth_middleware_1.authMiddleware, (req, res) => {
    console.log("🔐 [UserRoutes] /me → updateProfile");
    return (0, user_controller_1.updateProfile)(req, res);
});
/* =========================
   DISCOVER
   ========================= */
router.get("/discover", auth_middleware_1.authMiddleware, (req, res) => {
    console.log("🔍 [UserRoutes] /discover → discoverUsers", req.query);
    return (0, user_controller_1.discoverUsers)(req, res);
});
/* =========================
   PUBLIC PROFILE
   ========================= */
router.get("/:id", auth_middleware_1.authMiddleware, (req, res) => {
    console.log("👤 [UserRoutes] /:id → getPublicProfile", {
        userId: req.params.id,
    });
    return (0, user_controller_1.getPublicProfile)(req, res);
});
exports.default = router;
