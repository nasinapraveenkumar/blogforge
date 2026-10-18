
import {
  likePost,
  unlikePost,
  getPostLikeSummary,
} from "./like.service.js";

import { likePostSchema } from "./like.validation.js";

const sendError = (res, error, fallbackMessage) => {
  let statusCode;

  if (Number.isInteger(error.statusCode)) {
    statusCode = error.statusCode;
  } else if (error.name === "ZodError") {
    statusCode = 400;
  } else if (
    error.name === "CastError" ||
    error.name === "ValidationError"
  ) {
    statusCode = 400;
  } else {
    statusCode = 500;
  }

  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? fallbackMessage
        : error.message,
  });
};

// Like a published post.
export const like = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const data = await likePost({
      postId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post liked successfully",
      data,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to like post"
    );
  }
};

// Remove the current user's like.
export const unlike = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const data = await unlikePost({
      postId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post unliked successfully",
      data,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to unlike post"
    );
  }
};

// Get a public like count and optional user-specific like status.
export const getSummary = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const data = await getPostLikeSummary({
      postId,
      userId: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch like summary"
    );
  }
};
