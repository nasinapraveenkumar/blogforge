import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  create,
  getAll,
  getBySlug,
  update,
} from "./post.controller.js";

const router = express.Router();

router.get("/", getAll);
router.get("/:slug", getBySlug);

router.post("/", authenticate, create);
router.put("/:id", authenticate, update);

export default router;