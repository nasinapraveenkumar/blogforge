import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import {
  claimNext,
  approve,
  reject,
  getHistory,
} from "./moderation.controller.js";

const router = express.Router();

router.post(
  "/queue/claim-next",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  claimNext
);

router.post(
  "/posts/:id/approve",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  approve
);

router.post(
  "/posts/:id/reject",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  reject
);

router.get(
  "/posts/:id/history",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getHistory
);

export default router;