import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { like } from "./like.controller.js";

const router = express.Router();

// Like a published post
router.post(
  "/:postId",
  authenticate,
  like
);

export default router;