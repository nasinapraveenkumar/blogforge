import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BlogForge API is healthy",
  });
});

app.use("/api/auth", authRoutes);

export default app;