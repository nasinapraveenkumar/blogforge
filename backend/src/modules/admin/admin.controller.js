
import {
  getAdminStats,
  listUsers,
  updateUserRole,
  updateUserStatus,
   listPosts,
} from "./admin.service.js";

function handleError(res, error) {
  console.error("Admin API error:", error.message);

  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode ? error.message : "An unexpected server error occurred.",
  });
}

export async function stats(req, res) {
  try {
    const data = await getAdminStats();

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function users(req, res) {
  try {
    const data = await listUsers({
      search: String(req.query.search || ""),
      role: String(req.query.role || ""),
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function changeRole(req, res) {
  try {
    const data = await updateUserRole(
      req.user.id,
      req.params.userId,
      req.body.role
    );

    return res.json({
      success: true,
      message: "User role updated successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function changeStatus(req, res) {
  try {
    const data = await updateUserStatus(
      req.user.id,
      req.params.userId,
      req.body.isActive
    );

    return res.json({
      success: true,
      message: "User status updated successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function posts(req, res) {
  try {
    const data = await listPosts({
      search: String(req.query.search || ""),
      status: String(req.query.status || ""),
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}
