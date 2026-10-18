
import mongoose from "mongoose";
import Post from "../post/post.model.js";
import Moderation from "./moderation.model.js";

const createError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const REVIEW_LEASE_MINUTES = 30;

export const claimNextModerationPost = async (moderatorId) => {
  if (!mongoose.isValidObjectId(moderatorId)) {
    throw createError("Invalid moderator ID", 400);
  }

  // Recover reviews abandoned for more than 30 minutes.
  // This lets another moderator pick up a post after the lease expires.
  const expiredBefore = new Date(
    Date.now() - REVIEW_LEASE_MINUTES * 60 * 1000
  );

  await Post.updateMany(
    {
      status: "UNDER_REVIEW",
      "moderation.claimedAt": { $lt: expiredBefore },
    },
    {
      $set: { status: "SUBMITTED" },
      $unset: {
        "moderation.moderator": "",
        "moderation.claimedAt": "",
      },
    }
  );

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
      returnDocument: "after",
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
    throw createError("Invalid post ID", 400);
  }

  const reviewedAt = new Date();

  // Use a conditional update so two requests cannot approve the same
  // post after its review assignment has changed.
  const post = await Post.findOneAndUpdate(
    {
      _id: postId,
      status: "UNDER_REVIEW",
      "moderation.moderator": moderatorId,
    },
    {
      $set: {
        status: "PUBLISHED",
        publishedAt: reviewedAt,
        "moderation.reviewedAt": reviewedAt,
        "moderation.action": "APPROVE",
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!post) {
    throw createError(
      "Post not found or you are not assigned to review this post",
      409
    );
  }

  // Do not swallow audit failures. If this write fails, surface the error
  // so the problem is visible and can be handled instead of silently lost.
  await Moderation.create({
    post: post._id,
    moderator: moderatorId,
    action: "APPROVE",
    status: "COMPLETED",
    reviewedAt,
  });

  return post;
};

export const rejectModerationPost = async ({
  postId,
  moderatorId,
  reason,
}) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw createError("Invalid post ID", 400);
  }

  const normalizedReason = reason?.trim();

  if (!normalizedReason) {
    throw createError("Rejection reason is required", 400);
  }

  if (normalizedReason.length > 1000) {
    throw createError(
      "Rejection reason cannot exceed 1000 characters",
      400
    );
  }

  const reviewedAt = new Date();

  const post = await Post.findOneAndUpdate(
    {
      _id: postId,
      status: "UNDER_REVIEW",
      "moderation.moderator": moderatorId,
    },
    {
      $set: {
        status: "REJECTED",
        "moderation.moderator": moderatorId,
        "moderation.rejectionReason": normalizedReason,
        "moderation.reviewedAt": reviewedAt,
        "moderation.action": "REJECT",
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!post) {
    throw createError(
      "Post not found or you are not assigned to review this post",
      409
    );
  }

  await Moderation.create({
    post: post._id,
    moderator: moderatorId,
    action: "REJECT",
    status: "COMPLETED",
    reason: normalizedReason,
    reviewedAt,
  });

  return post;
};

export const getModerationHistory = async (postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw createError("Invalid post ID", 400);
  }

  return Moderation.find({ post: postId })
    .populate("moderator", "name email")
    .populate("post", "title slug status")
    .sort({ reviewedAt: -1, createdAt: -1 })
    .lean();
};

// Retrieve completed moderation decisions across all posts.
// Useful for a moderator's review-history dashboard.
export const getAllModerationHistory = async ({
  page = 1,
  limit = 20,
} = {}) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 20)
  );

  const filter = { status: "COMPLETED" };

  const [items, total] = await Promise.all([
    Moderation.find(filter)
      .populate("post", "title slug status author")
      .populate("moderator", "name email")
      .sort({ reviewedAt: -1, createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Moderation.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
};
