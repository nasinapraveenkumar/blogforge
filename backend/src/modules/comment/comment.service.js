
import mongoose from "mongoose";
import Comment from "./comment.model.js";
import Post from "../post/post.model.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

export const createComment = async ({
  postId,
  authorId,
  content,
}) => {
  if (!isValidId(postId)) {
    throw new Error("Invalid post ID");
  }

  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const comment = await Comment.create({
    post: postId,
    author: authorId,
    content: content.trim(),
  });

  return Comment.findById(comment._id).populate(
    "author",
    "name username"
  );
};

export const getCommentsByPost = async (postId) => {
  if (!isValidId(postId)) {
    throw new Error("Invalid post ID");
  }

  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  }).select("_id");

  if (!post) {
    throw new Error("Post not found");
  }

  return Comment.find({ post: postId })
    .populate("author", "name username")
    .sort({ createdAt: -1 })
    .lean();
};

export const updateComment = async ({
  commentId,
  authorId,
  content,
}) => {
  if (!isValidId(commentId)) {
    throw new Error("Invalid comment ID");
  }

  const comment = await Comment.findOne({
    _id: commentId,
    author: authorId,
  });

  if (!comment) {
    throw new Error(
      "Comment not found or you are not the owner"
    );
  }

  comment.content = content.trim();
  comment.isEdited = true;

  await comment.save();

  return Comment.findById(comment._id).populate(
    "author",
    "name username"
  );
};

export const deleteComment = async ({
  commentId,
  authorId,
}) => {
  if (!isValidId(commentId)) {
    throw new Error("Invalid comment ID");
  }

  const comment = await Comment.findOne({
    _id: commentId,
    author: authorId,
  });

  if (!comment) {
    throw new Error(
      "Comment not found or you are not the owner"
    );
  }

  await comment.deleteOne();

  return comment;
};
