
import { z } from "zod";

export const bookmarkPostSchema = z.object({
  postId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid post ID"),
});
