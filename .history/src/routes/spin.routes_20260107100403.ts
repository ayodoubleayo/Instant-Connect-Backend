import { Router } from "express";
import { SpinController } from "../controllers/spin.controller";

const router = Router();

router.post("/spin", SpinController.spin);

export default router;
