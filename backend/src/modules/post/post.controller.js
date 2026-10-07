import {
  createPost,
  getPublishedPosts,
  getPublishedPostBySlug,
} from "./post.service.js";

import { createPostSchema } from "./post.validation.js";

export const create = async (req, res) => {
  try {
    const validatedData = createPostSchema.parse(req.body);

    const post = await createPost({
      ...validatedData,
      authorId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { posts, pagination } = await getPublishedPosts(page, limit);

    res.status(200).json({
      success: true,
      data: posts,
      pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
    });
  }
};

export const getBySlug = async (req, res) => {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};