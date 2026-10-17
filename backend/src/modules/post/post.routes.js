
import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import {
  create,
  getAll,
  getBySlug,
  update,
  submit,
  getMine,
} from "./post.controller.js";

const router = express.Router();

// Public routes
router.get("/", getAll);

// Authenticated user's posts must come before /:slug
router.get("/mine", authenticate, getMine);

// Authenticated post actions
router.post("/", authenticate, create);
router.patch("/:id/submit", authenticate, submit);
router.patch("/:id", authenticate, update);

// Public post details
router.get("/:slug", getBySlug);

export default router;
