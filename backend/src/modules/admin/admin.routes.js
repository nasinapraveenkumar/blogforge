
import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";

import {
  stats,
  users,
  changeRole,
  changeStatus,
} from "./admin.controller.js";

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/stats", stats);
router.get("/users", users);
router.patch("/users/:userId/role", changeRole);
router.patch("/users/:userId/status", changeStatus);

export default router;
