
import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  like,
  unlike,
} from "./like.controller.js";

const router = express.Router();

// Like a post
router.post(
  "/:postId",
  authenticate,
  like
);

// Unlike a post
router.delete(
  "/:postId",
  authenticate,
  unlike
);

export default router;
