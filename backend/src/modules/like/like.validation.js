import { z } from "zod";

export const likePostSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
});