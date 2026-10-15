import Like from "./like.model.js";
import Post from "../post/post.model.js";

export const likePost = async ({
  postId,
  userId,
}) => {
  const post = await Post.findOne({
    _id: postId,
    status: "PUBLISHED",
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const existingLike = await Like.findOne({
    post: postId,
    user: userId,
  });

  if (existingLike) {
    throw new Error("You have already liked this post");
  }

  const like = await Like.create({
    post: postId,
    user: userId,
  });

  return like;
};

export const unlikePost = async ({
  postId,
  userId,
}) => {
  const like = await Like.findOne({
    post: postId,
    user: userId,
  });

  if (!like) {
    throw new Error("You have not liked this post");
  }

  await like.deleteOne();

  return like;
};