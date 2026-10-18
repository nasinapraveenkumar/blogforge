import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import {
  claimNext,
  approve,
  reject,
  getHistory,
  getAllHistory,
} from "./moderation.controller.js";

const router = express.Router();

// Claim the next submitted post for moderation
router.post(
  "/queue/claim-next",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  claimNext
);

// Approve and publish an assigned post
router.post(
  "/posts/:id/approve",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  approve
);

// Reject an assigned post
router.post(
  "/posts/:id/reject",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  reject
);

// Get moderation history for a specific post
router.get(
  "/posts/:id/history",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getHistory
);

// Get paginated history of completed moderation actions
// Optional query parameters: ?page=1&limit=20
router.get(
  "/history",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getAllHistory
);

export default router;
