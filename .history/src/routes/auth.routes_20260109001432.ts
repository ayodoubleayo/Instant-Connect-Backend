import { Router } from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
} from "../controllers/auth.controller.js";


const router = Router();

/* =========================
   AUTH ROUTES
========================= */

// Public auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Forgot password (public, safe)
router.post("/forgot-password", forgotPassword);

export default router;
