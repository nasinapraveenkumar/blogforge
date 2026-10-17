
import {
  likePost,
  unlikePost,
  getPostLikeSummary,
} from "./like.service.js";

import { likePostSchema } from "./like.validation.js";

export const like = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const data = await likePost({
      postId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post liked successfully",
      data,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const unlike = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const data = await unlikePost({
      postId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post unliked successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSummary = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const data = await getPostLikeSummary({
      postId,
      userId: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
