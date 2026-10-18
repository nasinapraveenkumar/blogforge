import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from "./comment.service.js";

import {
  createCommentSchema,
  updateCommentSchema,
} from "./comment.validation.js";

// Standardized error handling.
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

// Create a comment on a published post.
export const create = async (req, res) => {
  try {
    const { content } = createCommentSchema.parse(req.body);

    const comment = await createComment({
      postId: req.params.postId,
      authorId: req.user._id,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to create comment"
    );
  }
};

// Get comments for a published post.
export const getByPost = async (req, res) => {
  try {
    const comments = await getCommentsByPost(
      req.params.postId
    );

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch comments"
    );
  }
};

// Update the authenticated user's own comment.
export const update = async (req, res) => {
  try {
    const { content } = updateCommentSchema.parse(req.body);

    const comment = await updateComment({
      commentId: req.params.id,
      authorId: req.user._id,
      content,
    });

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to update comment"
    );
  }
};

// Delete the authenticated user's own comment.
export const remove = async (req, res) => {
  try {
    await deleteComment({
      commentId: req.params.id,
      authorId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to delete comment"
    );
  }
};
