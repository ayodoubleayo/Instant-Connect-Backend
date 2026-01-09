import { Router } from "express";
import { createPayment,    getPaymentByMatch, } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import { uploadPaymentProof } from "../controllers/payment.controller";

const router = Router();

router.post("/", authMiddleware, createPayment);
router.get("/", authMiddleware, getPaymentByMatch);
router.post(
  "/:id/proof",
  authMiddleware,
  upload.single("proof"),
  uploadPaymentProof
);

export default router;
