import { Router } from "express";
import {
  getProfile,
  updateProfile,
  discoverUsers,
  getPublicProfile,
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

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
router.get("/me", authMiddleware, (req, res) => {
  console.log("🔐 [UserRoutes] /me → getProfile");
  return getProfile(req, res);
});

router.put("/me", authMiddleware, (req, res) => {
  console.log("🔐 [UserRoutes] /me → updateProfile");
  return updateProfile(req, res);
});

/* =========================
   DISCOVER
   ========================= */
router.get("/discover", authMiddleware, (req, res) => {
  console.log("🔍 [UserRoutes] /discover → discoverUsers", req.query);
  return discoverUsers(req, res);
});

/* =========================
   PUBLIC PROFILE
   ========================= */
router.get("/:id", authMiddleware, (req, res) => {
  console.log("👤 [UserRoutes] /:id → getPublicProfile", {
    userId: req.params.id,
  });
  return getPublicProfile(req, res);
});

export default router;
