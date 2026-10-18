
import {
  createBookmark,
  removeBookmark,
  getMyBookmarks,
} from "./bookmark.service.js";

import { bookmarkPostSchema } from "./bookmark.validation.js";

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

// Bookmark a published post.
export const create = async (req, res) => {
  try {
    const { postId } = bookmarkPostSchema.parse({
      postId: req.params.postId,
    });

    const bookmark = await createBookmark({
      postId,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Post bookmarked successfully",
      data: bookmark,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to bookmark post"
    );
  }
};

// Remove a bookmark belonging to the logged-in user.
export const remove = async (req, res) => {
  try {
    const { postId } = bookmarkPostSchema.parse({
      postId: req.params.postId,
    });

    const bookmark = await removeBookmark({
      postId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
      data: bookmark,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to remove bookmark"
    );
  }
};

// Get the logged-in user's bookmarks.
export const getAll = async (req, res) => {
  try {
    const bookmarks = await getMyBookmarks(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Bookmarks fetched successfully",
      data: bookmarks,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch bookmarks"
    );
  }
};
