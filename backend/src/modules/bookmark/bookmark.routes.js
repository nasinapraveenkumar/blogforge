
import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import {
  create,
  remove,
  getAll,
} from "./bookmark.controller.js";

const router = express.Router();

router.get("/", authenticate, getAll);

router.post("/:postId", authenticate, create);

router.delete("/:postId", authenticate, remove);

export default router;
