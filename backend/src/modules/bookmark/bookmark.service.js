import mongoose from "mongoose";
import Bookmark from "./bookmark.model.js";
import Post from "../post/post.model.js";

const createError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const isValidId = (id) =>
  mongoose.isValidObjectId(id);

// Add a published post to the user's bookmarks.
export const createBookmark = async ({
  postId,
  userId,
}) => {
  if (!isValidId(postId)) {
    throw createError("Invalid post ID", 400);
  }

  if (!isValidId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  }).select("_id");

  if (!post) {
    throw createError("Published post not found", 404);
  }

  try {
    return await Bookmark.create({
      post: postId,
      user: userId,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "You have already bookmarked this post",
        409
      );
    }

    throw error;
  }
};

// Remove a bookmark belonging to the authenticated user.
export const removeBookmark = async ({
  postId,
  userId,
}) => {
  if (!isValidId(postId)) {
    throw createError("Invalid post ID", 400);
  }

  if (!isValidId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  const bookmark = await Bookmark.findOneAndDelete({
    post: postId,
    user: userId,
  });

  if (!bookmark) {
    throw createError("Bookmark not found", 404);
  }

  return bookmark;
};

// Retrieve the authenticated user's bookmarks.
export const getMyBookmarks = async (userId) => {
  if (!isValidId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  const bookmarks = await Bookmark.find({
    user: userId,
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "post",
      match: { status: "PUBLISHED" },
      select: "title slug excerpt coverImage publishedAt author",
      populate: {
        path: "author",
        select: "name username",
      },
    })
    .lean();

  // Do not return bookmarks whose posts are no longer published.
  return bookmarks.filter((bookmark) => bookmark.post);
};
