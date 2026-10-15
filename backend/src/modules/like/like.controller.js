import { likePost } from "./like.service.js";
import { likePostSchema } from "./like.validation.js";

export const like = async (req, res) => {
  try {
    const { postId } = likePostSchema.parse({
      postId: req.params.postId,
    });

    const like = await likePost({
      postId,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Post liked successfully",
      data: like,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};