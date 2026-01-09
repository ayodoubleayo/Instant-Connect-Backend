import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
import {
  approvePayment,
  getAdminPayments,
  getAdminStats,
  getAdminUsers,
  toggleSuspendUser,
  toggleBlockUser,
  getAdminWinners,
  markPayoutAsPaid,
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
router.get("/users", authMiddleware, adminMiddleware, getAdminUsers);

router.post(
  "/users/:id/suspend",
  authMiddleware,
  adminMiddleware,
  toggleSuspendUser
);

router.post(
  "/users/:id/block",
  authMiddleware,
  adminMiddleware,
  toggleBlockUser
);

/* ======================================================
   ADMIN WINNERS & PAYOUTS
====================================================== */
router.get(
  "/winners",
  authMiddleware,
  adminMiddleware,
  getAdminWinners
);

router.post(
  "/payouts/:id/paid",
  authMiddleware,
  adminMiddleware,
  markPayoutAsPaid
);

export default router;
