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
import bookmarkRoutes from "./modules/bookmark/bookmark.routes.js";
import reportRoutes from "./modules/report/report.routes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BlogForge API is healthy",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/reports", reportRoutes);

export default app;