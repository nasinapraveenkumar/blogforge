import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { create, getMine, getPending, review } from "./report.controller.js";

const router = express.Router();

router.get("/mine", authenticate, getMine);
router.get("/moderation/pending", authenticate, authorize("MODERATOR", "ADMIN"), getPending);
router.post("/:postId", authenticate, create);
router.patch("/:id/review", authenticate, authorize("MODERATOR", "ADMIN"), review);

export default router;
