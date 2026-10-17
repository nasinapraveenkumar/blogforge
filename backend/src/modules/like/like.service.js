
import mongoose from "mongoose";
import Like from "./like.model.js";
import Post from "../post/post.model.js";

export const likePost = async ({ postId, userId }) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new Error("Invalid post ID");
  }

  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  }).select("_id");

  if (!post) {
    throw new Error("Post not found");
  }

  try {
    await Like.create({
      post: postId,
      user: userId,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("You have already liked this post");
    }
    throw error;
  }

  return getPostLikeSummary({ postId, userId });
};

export const unlikePost = async ({ postId, userId }) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new Error("Invalid post ID");
  }

  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  }).select("_id");

  if (!post) {
    throw new Error("Post not found");
  }

  const result = await Like.deleteOne({
    post: postId,
    user: userId,
  });

  if (result.deletedCount === 0) {
    throw new Error("You have not liked this post");
  }

  return getPostLikeSummary({ postId, userId });
};

export const getPostLikeSummary = async ({ postId, userId }) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new Error("Invalid post ID");
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
