
import mongoose from "mongoose";
import User from "../auth/auth.model.js";

const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

function throwError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

export async function getAdminStats() {
  const [totalUsers, activeUsers, inactiveUsers, roleCounts] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    ]);

  const roles = {
    USER: 0,
    MODERATOR: 0,
    ADMIN: 0,
  };

  for (const item of roleCounts) {
    if (Object.hasOwn(roles, item._id)) {
      roles[item._id] = item.count;
    }
  }

  return { totalUsers, activeUsers, inactiveUsers, roles };
}

export async function listUsers({
  search = "",
  role = "",
  page = 1,
  limit = 20,
} = {}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = {};

  if (role && VALID_ROLES.includes(role)) {
    filter.role = role;
  }

  if (search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("_id name email role isActive createdAt")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function updateUserRole(adminId, targetId, role) {
  if (!mongoose.isValidObjectId(targetId)) {
    throwError("Invalid user ID.", 400);
  }

  if (!VALID_ROLES.includes(role)) {
    throwError("Invalid role.", 400);
  }

  if (String(adminId) === String(targetId)) {
    throwError("You cannot change your own role.", 400);
  }

  const target = await User.findById(targetId);

  if (!target) {
    throwError("User not found.", 404);
  }

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      isActive: true,
    });

    if (target.isActive && activeAdminCount <= 1) {
      throwError("You cannot demote the last active admin.", 400);
    }
  }

  target.role = role;
  await target.save();

  return {
    id: target._id,
    name: target.name,
    email: target.email,
    role: target.role,
    isActive: target.isActive,
  };
}

export async function updateUserStatus(adminId, targetId, isActive) {
  if (!mongoose.isValidObjectId(targetId)) {
    throwError("Invalid user ID.", 400);
  }

  if (typeof isActive !== "boolean") {
    throwError("isActive must be true or false.", 400);
  }

  if (String(adminId) === String(targetId)) {
    throwError("You cannot deactivate your own account.", 400);
  }

  const target = await User.findById(targetId);

  if (!target) {
    throwError("User not found.", 404);
  }

  if (target.role === "ADMIN" && target.isActive && !isActive) {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      isActive: true,
    });

    if (activeAdminCount <= 1) {
      throwError("You cannot deactivate the last active admin.", 400);
    }
  }

  target.isActive = isActive;
  await target.save();

  return {
    id: target._id,
    name: target.name,
    email: target.email,
    role: target.role,
    isActive: target.isActive,
  };
}
