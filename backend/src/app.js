import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import postRoutes from "./modules/post/post.routes.js";
import moderationRoutes from "./modules/moderation/moderation.routes.js";
import commentRoutes from "./modules/comment/comment.routes.js";
import likeRoutes from "./modules/like/like.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BlogForge API is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);

export default app;