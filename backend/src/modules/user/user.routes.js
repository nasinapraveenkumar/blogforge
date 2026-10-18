
import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  getMe,
  updateMe,
  changePassword,
} from "./user.controller.js";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);
router.patch("/change-password", authenticate, changePassword);

export default router;
