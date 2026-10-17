
import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  like,
  unlike,
  getSummary,
} from "./like.controller.js";

const router = express.Router();

// Get total likes and the current user's like state.
router.get("/summary/:postId", getSummary);

// Like a post.
router.post("/:postId", authenticate, like);

// Unlike a post.
router.delete("/:postId", authenticate, unlike);

export default router;
