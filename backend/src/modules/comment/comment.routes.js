import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  create,
  getByPost,
  update,
  remove,
} from "./comment.controller.js";

const router = express.Router();

// Get comments for a post
router.get(
  "/:postId",
  getByPost
);

// Create a comment
router.post(
  "/:postId",
  authenticate,
  create
);

// Update your own comment
router.put(
  "/:id",
  authenticate,
  update
);

// Delete your own comment
router.delete(
  "/:id",
  authenticate,
  remove
);

export default router;