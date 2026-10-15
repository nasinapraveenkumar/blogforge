import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from "./comment.service.js";

import { createCommentSchema } from "./comment.validation.js";

export const create = async (req, res) => {
  try {
    const { content } = createCommentSchema.parse(req.body);

    const comment = await createComment({
      postId: req.params.postId,
      authorId: req.user._id,
      content,
    });

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getByPost = async (req, res) => {
  try {
    const comments = await getCommentsByPost(req.params.postId);

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
};

export const update = async (req, res) => {
  try {
    const { content } = createCommentSchema.parse(req.body);

    const comment = await updateComment({
      commentId: req.params.id,
      authorId: req.user._id,
      content,
    });

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const remove = async (req, res) => {
  try {
    await deleteComment({
      commentId: req.params.id,
      authorId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};