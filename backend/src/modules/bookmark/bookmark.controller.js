
import {
  createBookmark,
  removeBookmark,
  getMyBookmarks,
} from "./bookmark.service.js";

import { bookmarkPostSchema } from "./bookmark.validation.js";

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
    const status = error.name === "ZodError" ? 400 : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

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
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const bookmarks = await getMyBookmarks(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Bookmarks fetched successfully",
      data: bookmarks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookmarks",
    });
  }
};
