import { Router } from "express";
import {
  getProfile,
  updateProfile,
  discoverUsers,
  getPublicProfile,
  deletePhoto,
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePhotoMiddleware } from "../middleware/requirePhoto.middleware";

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
router.get(
  "/discover",
  authMiddleware,
  requirePhotoMiddleware,
  (req, res) => {
    console.log("🔍 [UserRoutes] /discover → discoverUsers", req.query);
    return discoverUsers(req, res);
  }
);


/* =========================
   PUBLIC PROFILE
   ========================= */
router.get(
  "/:id",
  authMiddleware,
  requirePhotoMiddleware,
  (req, res) => {
    console.log("👤 [UserRoutes] /:id → getPublicProfile", {
      userId: req.params.id,
    });
    return getPublicProfile(req, res);
  }
);
router.delete(
  "/me/photos/:photoId",
  authMiddleware,
  (req, res) => {
    console.log("🗑️ [UserRoutes] /me/photos/:photoId → deletePhoto", {
      photoId: req.params.photoId,
    });
    return deletePhoto(req, res);
  }
);

export default router;
