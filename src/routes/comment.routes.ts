import { Router } from "express";
import { CommentController } from "../controllers/comment.controller";

const router = Router();

router.post("/", CommentController.post);
router.get("/", CommentController.list);

export default router;
