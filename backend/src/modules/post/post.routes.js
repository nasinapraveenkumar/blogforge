import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { create, getAll, getBySlug } from "./post.controller.js";

const router = express.Router();

router.get("/", getAll);
router.get("/:slug", getBySlug);

router.post("/", authenticate, create);

export default router;