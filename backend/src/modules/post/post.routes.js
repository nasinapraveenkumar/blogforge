import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { create } from "./post.controller.js";

const router = express.Router();

router.post("/", authenticate, create);

export default router;