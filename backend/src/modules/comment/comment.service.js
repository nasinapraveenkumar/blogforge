import mongoose from "mongoose";
import Comment from "./comment.model.js";
import Post from "../post/post.model.js";

const createError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const isValidId = (id) => mongoose.isValidObjectId(id);

const COMMENT_POPULATE = {
  path: "author",
  select: "name username",
};

// Create a comment on a published post.
export const createComment = async ({
  postId,
  authorId,
  content,
}) => {
  if (!isValidId(postId)) {
    throw createError("Invalid post ID", 400);
  }

  if (!isValidId(authorId)) {
    throw createError("Invalid author ID", 400);
  }

  const normalizedContent =
    typeof content === "string" ? content.trim() : "";

  if (!normalizedContent) {
    throw createError("Comment content is required", 400);
  }

  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  }).select("_id");

  if (!post) {
    throw createError("Published post not found", 404);
  }

  const comment = await Comment.create({
    post: postId,
    author: authorId,
    content: normalizedContent,
  });

  return Comment.findById(comment._id)
    .populate(COMMENT_POPULATE)
    .orFail(() => createError("Comment could not be retrieved", 500));
};

// Retrieve comments for a published post.
export const getCommentsByPost = async (postId) => {
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

  return Comment.find({ post: postId })
    .populate(COMMENT_POPULATE)
    .sort({ createdAt: -1 })
    .lean();
};

// Update only a comment owned by the requesting user.
export const updateComment = async ({
  commentId,
  authorId,
  content,
}) => {
  if (!isValidId(commentId)) {
    throw createError("Invalid comment ID", 400);
  }

  if (!isValidId(authorId)) {
    throw createError("Invalid author ID", 400);
  }

  const normalizedContent =
    typeof content === "string" ? content.trim() : "";

  if (!normalizedContent) {
    throw createError("Comment content is required", 400);
  }

  const comment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      author: authorId,
    },
    {
      $set: {
        content: normalizedContent,
        isEdited: true,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).populate(COMMENT_POPULATE);

  if (!comment) {
    throw createError(
      "Comment not found or you are not the owner",
      404
    );
  }

  return comment;
};

// Delete only a comment owned by the requesting user.
export const deleteComment = async ({
  commentId,
  authorId,
}) => {
  if (!isValidId(commentId)) {
    throw createError("Invalid comment ID", 400);
  }

  if (!isValidId(authorId)) {
    throw createError("Invalid author ID", 400);
  }

  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    author: authorId,
  });

  if (!comment) {
    throw createError(
      "Comment not found or you are not the owner",
      404
    );
  }

  return comment;
};
