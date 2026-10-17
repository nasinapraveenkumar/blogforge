
import mongoose from "mongoose";
import {
  claimNextModerationPost,
  approveModerationPost,
  rejectModerationPost,
  getModerationHistory,
} from "./moderation.service.js";

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

export const claimNext = async (req, res) => {
  try {
    const post = await claimNextModerationPost(req.user._id);

    if (!post) {
      return res.status(200).json({
        success: true,
        message: "No posts are waiting for moderation",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post claimed successfully",
      data: post,
    });
  } catch (error) {
    console.error("Claim moderation post error:", error);

    return sendError(
      res,
      500,
      "Failed to claim moderation post"
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

    const status =
      error.name === "CastError" ? 400 : 400;

    return sendError(
      res,
      status,
      error.message || "Failed to approve post"
    );
  }
};

export const reject = async (req, res) => {
  try {
    const { reason } = req.body || {};

    if (typeof reason !== "string" || !reason.trim()) {
      return sendError(
        res,
        400,
        "Rejection reason is required"
      );
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

    return sendError(
      res,
      400,
      error.message || "Failed to reject post"
    );
  }
};

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
