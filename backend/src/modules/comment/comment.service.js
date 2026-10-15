import Comment from "./comment.model.js";
import Post from "../post/post.model.js";

export const createComment = async ({
  postId,
  authorId,
  content,
}) => {
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
    content,
  });

  return comment;
};
export const getCommentsByPost = async (postId) => {
  const comments = await Comment.find({
    post: postId,
  })
    .populate("author", "name")
    .sort({ createdAt: -1 });

  return comments;
};
export const updateComment = async ({
  commentId,
  authorId,
  content,
}) => {
  const comment = await Comment.findOne({
    _id: commentId,
    author: authorId,
  });

  if (!comment) {
    throw new Error(
      "Comment not found or you are not the owner"
    );
  }

  comment.content = content;
  comment.isEdited = true;

  await comment.save();

  return comment;
};
export const deleteComment = async ({
  commentId,
  authorId,
}) => {
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