
import mongoose from "mongoose";

import {
  createPost,
  getPublishedPosts,
  getPublishedPostBySlug,
  updatePost,
  submitPost,
  getMyPosts,
} from "./post.service.js";

import {
  createPostSchema,
  updatePostSchema,
} from "./post.validation.js";

export const create = async (req, res) => {
  try {
    const validatedData = createPostSchema.parse(req.body);

    const post = await createPost({
      ...validatedData,
      authorId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.error("Create post error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create post",
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 50",
      });
    }

    const { posts, pagination } = await getPublishedPosts(page, limit);

    return res.status(200).json({
      success: true,
      data: posts,
      pagination,
    });
  } catch (error) {
    console.error("Get published posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
    });
  }
};

export const getBySlug = async (req, res) => {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error.message === "Post not found") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    console.error("Get post by slug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch article",
    });
  }
};

export const update = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const validatedData = updatePostSchema.parse(req.body);

    const post = await updatePost({
      ...validatedData,
      postId: req.params.id,
      authorId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error("Update post error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update post",
    });
  }
};

export const submit = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await submitPost({
      postId: req.params.id,
      authorId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post submitted for review",
      data: post,
    });
  } catch (error) {
    console.error("Submit post error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to submit post",
    });
  }
};

export const getMine = async (req, res) => {
  try {
    const result = await getMyPosts(req.user._id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get user's posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your posts",
    });
  }
};
