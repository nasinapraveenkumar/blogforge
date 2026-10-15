
import { likePost, unlikePost } from "./like.service.js";
import { likePostSchema } from "./like.validation.js";

export const like = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const result = await likePost({
      postId,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Post liked successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
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

    const result = await unlikePost({
      postId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Post unliked successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
