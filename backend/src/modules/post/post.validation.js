
import { z } from "zod";

const tagsSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      return value.split(",");
    }

    return value;
  },
  z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tags cannot be empty")
        .max(30, "Each tag must be at most 30 characters")
    )
    .max(10, "You can add at most 10 tags")
    .transform((tags) => [
      ...new Set(tags.map((tag) => tag.toLowerCase())),
    ])
    .optional()
);

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

  tags: tagsSchema,

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

  tags: tagsSchema,
});
