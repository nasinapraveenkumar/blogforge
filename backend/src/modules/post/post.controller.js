import { createPost } from "./post.service.js";
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