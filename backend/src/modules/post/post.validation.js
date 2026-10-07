import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be at most 150 characters"),

  content: z
    .string()
    .trim()
    .min(50, "Content must be at least 50 characters"),

  excerpt: z
    .string()
    .trim()
    .max(300, "Excerpt must be at most 300 characters")
    .optional(),

  category: z
    .string()
    .trim()
    .optional(),

  tags: z
    .array(z.string().trim())
    .optional(),

  coverImage: z
    .object({
      url: z.string().url().optional(),
      publicId: z.string().trim().optional(),
    })
    .optional(),
});
export const updatePostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be at most 150 characters"),

  content: z
    .string()
    .trim()
    .min(50, "Content must be at least 50 characters"),

  excerpt: z
    .string()
    .trim()
    .max(300, "Excerpt must be at most 300 characters")
    .optional(),
});