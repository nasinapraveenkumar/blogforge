import Post from "../post/post.model.js";
import Moderation from "./moderation.model.js";

export const claimNextModerationPost = async (moderatorId) => {
  const post = await Post.findOneAndUpdate(
    {
      status: "SUBMITTED",
    },
    {
      $set: {
        status: "UNDER_REVIEW",
        "moderation.moderator": moderatorId,
        "moderation.claimedAt": new Date(),
      },
    },
    {
      sort: {
        createdAt: 1,
      },
      new: true,
    }
  ).populate("author", "name email");

  return post;
};

export const approveModerationPost = async ({
  postId,
  moderatorId,
}) => {
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

  await Moderation.create({
    post: post._id,
    moderator: moderatorId,
    action: "APPROVE",
    status: "COMPLETED",
    reviewedAt: new Date(),
  });

  post.status = "PUBLISHED";
  post.publishedAt = new Date();

  await post.save();

  return post;
};

export const rejectModerationPost = async ({
  postId,
  moderatorId,
  reason,
}) => {
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

  await Moderation.create({
    post: post._id,
    moderator: moderatorId,
    action: "REJECT",
    status: "COMPLETED",
    reason,
    reviewedAt: new Date(),
  });

  post.status = "DRAFT";
  post.moderation = undefined;

  await post.save();

  return post;
};

export const getModerationHistory = async (postId) => {
  const history = await Moderation.find({
    post: postId,
  })
    .populate("moderator", "name email")
    .sort({ createdAt: -1 });

  return history;
};