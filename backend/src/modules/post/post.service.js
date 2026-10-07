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

  const existingPost = await Post.findOne({ slug });

  if (existingPost) {
    throw new Error("A post with this URL already exists");
  }

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

export const getPublishedPosts = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const filter = {
    status: "PUBLISHED",
  };

  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name"),

    Post.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalPosts / limit);

  return {
    posts,
    pagination: {
      currentPage: page,
      limit,
      totalPosts,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const getPublishedPostBySlug = async (slug) => {
  const post = await Post.findOne({
    slug,
    status: "PUBLISHED",
  }).populate("author", "name");

  if (!post) {
    throw new Error("Post not found");
  }

  return post;
};

export const updatePost = async ({
  postId,
  authorId,
  title,
  content,
  excerpt,
}) => {
  const post = await Post.findOne({
  _id: postId,
  author: authorId,
  status: "DRAFT",
});

  if (!post) {
    throw new Error("Post not found or you are not the owner");
  }

  const newSlug = generateSlug(title);

  if (newSlug !== post.slug) {
    const existingPost = await Post.findOne({
      slug: newSlug,
      _id: { $ne: postId },
    });

    if (existingPost) {
      throw new Error("A post with this URL already exists");
    }

    post.slug = newSlug;
  }

  post.title = title;
  post.content = content;
  post.excerpt = excerpt;

  await post.save();

  return post;
};