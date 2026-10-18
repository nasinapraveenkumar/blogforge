
import mongoose from "mongoose";
import {
  claimNextModerationPost,
  approveModerationPost,
  rejectModerationPost,
  getModerationHistory,
  getAllModerationHistory,
} from "./moderation.service.js";

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const getErrorStatus = (error) => {
  if (Number.isInteger(error.statusCode)) {
    return error.statusCode;
  }

  if (error.name === "CastError" || error.name === "ValidationError") {
    return 400;
  }

  return 500;
};

export const claimNext = async (req, res) => {
  try {
    const post = await claimNextModerationPost(req.user._id);

    return res.status(200).json({
      success: true,
      message: post
        ? "Post claimed successfully"
        : "No posts are waiting for moderation",
      data: post,
    });
  } catch (error) {
    console.error("Claim moderation post error:", error);

    return sendError(
      res,
      getErrorStatus(error),
      getErrorStatus(error) >= 500
        ? "Failed to claim moderation post"
        : error.message
    );
  }
};

export const approve = async (req, res) => {
  try {
    const post = await approveModerationPost({
      postId: req.params.id,
      moderatorId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post approved and published successfully",
      data: post,
    });
  } catch (error) {
    console.error("Approve moderation post error:", error);

    const status = getErrorStatus(error);

    return sendError(
      res,
      status,
      status >= 500
        ? "Failed to approve post"
        : error.message
    );
  }
};

export const reject = async (req, res) => {
  try {
    const { reason } = req.body || {};

    if (typeof reason !== "string" || !reason.trim()) {
      return sendError(res, 400, "Rejection reason is required");
    }

    if (reason.trim().length > 1000) {
      return sendError(
        res,
        400,
        "Rejection reason cannot exceed 1000 characters"
      );
    }

    const post = await rejectModerationPost({
      postId: req.params.id,
      moderatorId: req.user._id,
      reason: reason.trim(),
    });

    return res.status(200).json({
      success: true,
      message: "Post rejected successfully",
      data: post,
    });
  } catch (error) {
    console.error("Reject moderation post error:", error);

    const status = getErrorStatus(error);

    return sendError(
      res,
      status,
      status >= 500
        ? "Failed to reject post"
        : error.message
    );
  }
};

// History for one post.
export const getHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid post ID");
    }

    const history = await getModerationHistory(id);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Get moderation history error:", error);

    return sendError(
      res,
      500,
      "Failed to fetch moderation history"
    );
  }
};

// History across all posts, newest completed review first.
// Supports ?page=1&limit=20.
export const getAllHistory = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return sendError(
        res,
        400,
        "Page must be positive and limit must be between 1 and 100"
      );
    }

    const history = await getAllModerationHistory({ page, limit });

    return res.status(200).json({
      success: true,
      data: history.items,
      pagination: history.pagination,
    });
  } catch (error) {
    console.error("Get all moderation history error:", error);

    return sendError(
      res,
      500,
      "Failed to fetch completed moderation history"
    );
  }
};
