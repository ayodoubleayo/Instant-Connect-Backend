import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import {
  // existing
  approvePayment,
  getAdminPayments,
  getAdminStats,

  // new
  getAdminUsers,
  toggleSuspendUser,
  toggleBlockUser,
} from "../controllers/admin.controller";

const router = Router();

/* ======================================================
   ADMIN DASHBOARD
   ====================================================== */
router.get("/stats", authMiddleware, adminMiddleware, getAdminStats);

/* ======================================================
   ADMIN PAYMENTS
   ====================================================== */
router.get("/payments", authMiddleware, adminMiddleware, getAdminPayments);

router.post(
  "/payments/:id/approve",
  authMiddleware,
  adminMiddleware,
  approvePayment
);

/* ======================================================
   ADMIN USERS (GOVERNANCE)
   ====================================================== */

// list users (paginated)
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAdminUsers
);

// suspend / unsuspend user
router.post(
  "/users/:id/suspend",
  authMiddleware,
  adminMiddleware,
  toggleSuspendUser
);

// block / unblock user
router.post(
  "/users/:id/block",
  authMiddleware,
  adminMiddleware,
  toggleBlockUser
);

export default router;
