import express from "express";
import multer from "multer";
import { uploadPhoto } from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", authMiddleware, upload.single("image"), uploadPhoto);

export default router;
