
import mongoose from "mongoose";
import Post from "../post/post.model.js";
import Moderation from "./moderation.model.js";

export const claimNextModerationPost = async (moderatorId) => {
  const post = await Post.findOneAndUpdate(
    { status: "SUBMITTED" },
    {
      $set: {
        status: "UNDER_REVIEW",
        "moderation.moderator": moderatorId,
        "moderation.claimedAt": new Date(),
      },
    },
    {
      sort: { createdAt: 1 },
      new: true,
      runValidators: true,
    }
  )
    .populate("author", "name email")
    .populate("tags", "name slug");

  return post;
};

export const approveModerationPost = async ({
  postId,
  moderatorId,
}) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new Error("Invalid post ID");
  }

  const post = await Post.findOne({
    _id: postId,
    status: "UNDER_REVIEW",
    "moderation.moderator": moderatorId,
  });

  if (!post) {
    throw new Error(
      "Post not found or you are not assigned to review this post"
    );
  }

  post.status = "PUBLISHED";
  post.publishedAt = new Date();

  await post.save();

  try {
    await Moderation.create({
      post: post._id,
      moderator: moderatorId,
      action: "APPROVE",
      status: "COMPLETED",
      reviewedAt: new Date(),
    });
  } catch (error) {
    // Preserve the publication result, but log the missing audit record.
    console.error("Failed to record approval history:", error);
  }

  return post;
};

export const rejectModerationPost = async ({
  postId,
  moderatorId,
  reason,
}) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new Error("Invalid post ID");
  }

  if (!reason?.trim()) {
    throw new Error("Rejection reason is required");
  }

  const post = await Post.findOne({
    _id: postId,
    status: "UNDER_REVIEW",
    "moderation.moderator": moderatorId,
  });

  if (!post) {
    throw new Error(
      "Post not found or you are not assigned to review this post"
    );
  }

  post.status = "REJECTED";
  post.moderation = {
    ...post.moderation?.toObject?.(),
    moderator: moderatorId,
    rejectionReason: reason.trim(),
  };

  await post.save();

  try {
    await Moderation.create({
      post: post._id,
      moderator: moderatorId,
      action: "REJECT",
      status: "COMPLETED",
      reason: reason.trim(),
      reviewedAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to record rejection history:", error);
  }

  return post;
};

export const getModerationHistory = async (postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new Error("Invalid post ID");
  }

  return Moderation.find({ post: postId })
    .populate("moderator", "name email")
    .sort({ createdAt: -1 })
    .lean();
};
