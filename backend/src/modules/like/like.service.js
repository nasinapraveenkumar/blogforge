import mongoose from "mongoose";
import Like from "./like.model.js";
import Post from "../post/post.model.js";

const createError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const isValidId = (id) =>
  mongoose.isValidObjectId(id);

// Like a published post.
export const likePost = async ({ postId, userId }) => {
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
    await Like.create({
      post: postId,
      user: userId,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "You have already liked this post",
        409
      );
    }

    throw error;
  }

  return getPostLikeSummary({ postId, userId });
};

// Remove the authenticated user's like.
export const unlikePost = async ({ postId, userId }) => {
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

  const result = await Like.deleteOne({
    post: postId,
    user: userId,
  });

  if (result.deletedCount === 0) {
    throw createError(
      "You have not liked this post",
      409
    );
  }

  return getPostLikeSummary({ postId, userId });
};

// Get the like count and whether a particular user liked the post.
// Omit userId for a public, anonymous summary.
export const getPostLikeSummary = async ({
  postId,
  userId,
}) => {
  if (!isValidId(postId)) {
    throw createError("Invalid post ID", 400);
  }

  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  }).select("_id");

  if (!post) {
    throw createError("Published post not found", 404);
  }

  if (userId != null && !isValidId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  const [likeCount, liked] = await Promise.all([
    Like.countDocuments({ post: postId }),
    userId
      ? Like.exists({ post: postId, user: userId })
      : Promise.resolve(false),
  ]);

  return {
    likeCount,
    liked: Boolean(liked),
  };
};