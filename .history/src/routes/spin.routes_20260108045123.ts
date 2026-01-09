// spin.routes.ts
import { Router } from "express";
import { SpinController } from "../controllers/spin.controller";

const router = Router();

// Remove the extra /spin
router.get("/status", SpinController.status);
router.post("/", SpinController.spin);

export default router;
