
import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import profilePhotoUpload from "../../middleware/profilePhoto.middleware.js";

import {
  getMe,
  updateMe,
  changePassword,
  updateProfilePhoto,
} from "./user.controller.js";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

router.patch(
  "/me/photo",
  authenticate,
  profilePhotoUpload.single("profilePhoto"),
  updateProfilePhoto
);

router.patch("/change-password", authenticate, changePassword);

export default router;
