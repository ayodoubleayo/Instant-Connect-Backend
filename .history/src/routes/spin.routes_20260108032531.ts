import { Router } from "express";
import { SpinController } from "../controllers/spin.controller";

const router = Router();

router.get("/spin/status", SpinController.status);
router.post("/spin", SpinController.spin);

export default router;
