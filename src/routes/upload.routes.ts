import { Router } from "express";
import multer from "multer";
import { uploadPhoto } from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// temp local storage (Cloudinary will take it from here)
const upload = multer({ dest: "uploads/" });

// POST /upload
router.post(
  "/",
  authMiddleware,
  upload.single("photo"),
  uploadPhoto
);

export default router;
