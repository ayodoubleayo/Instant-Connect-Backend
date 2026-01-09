import { Router } from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";

const router = Router();

/* =========================
   AUTH ROUTES
========================= */

// Existing routes (unchanged behavior)
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// New routes (added safely)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
