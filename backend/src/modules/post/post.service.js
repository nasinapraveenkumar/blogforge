import Post from "./post.model.js";
import { generateSlug } from "../../utils/slug.js";

export const createPost = async ({
  title,
  content,
  excerpt,
  category,
  tags,
  coverImage,
  authorId,
}) => {
  const slug = generateSlug(title);

  const post = await Post.create({
    title,
    slug,
    content,
    excerpt,
    category,
    tags,
    coverImage,
    author: authorId,
  });

  return post;
};