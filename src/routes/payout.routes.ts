import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  submitPayout,
} from "../controllers/payout.controller";

const router = Router();

/* ======================================================
   USER PAYOUT
====================================================== */

router.post(
  "/payout",
  authMiddleware,
  submitPayout
);

export default router;
