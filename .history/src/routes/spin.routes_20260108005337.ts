import { Router } from "express";
import { SpinController } from "../controllers/spin.controller";

const router = Router();

/**
 * STEP 1 — Check spin availability
 * Frontend uses this to decide whether to show / enable the wheel
 */
router.get("/spin/status", SpinController.status);


router.post("/spin", SpinController.spin);

export default router;
